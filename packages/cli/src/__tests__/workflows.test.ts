import {readFile} from 'node:fs/promises';
import {describe, expect, it} from 'vitest';
import {parse} from 'yaml';

const repositoryRoot = new URL('../../../..', import.meta.url);
async function workflowSource(name: string) {
  return readFile(new URL(`.github/workflows/${name}`, repositoryRoot), 'utf8');
}

async function workflow(name: string) {
  return parse(await workflowSource(name));
}

function jobRuns(job: {steps?: Array<{run?: string}>}): string[] {
  return (job.steps ?? []).flatMap((step) => (typeof step.run === 'string' ? [step.run] : []));
}

describe('GitHub workflows', () => {
  it('keeps CI triggers and exposes a reusable ref input', async () => {
    const ci = await workflow('ci.yml');
    expect(ci.on.push.branches).toEqual(['main']);
    expect(ci.on).toHaveProperty('pull_request');
    expect(ci.on.workflow_call.inputs.ref).toMatchObject({required: false, type: 'string'});
    expect(ci.jobs.test.strategy.matrix['node-version']).toEqual([20, 22]);
  });

  it('defines release triggers and immutable per-tag concurrency', async () => {
    const publish = await workflow('publish.yml');
    expect(publish.on.push.tags).toEqual(['v*']);
    expect(publish.on.workflow_dispatch.inputs.tag).toMatchObject({required: true, type: 'string'});
    expect(publish.permissions).toEqual({});
    expect(publish.concurrency).toEqual({
      group: "publish-${{ github.event_name == 'workflow_dispatch' && inputs.tag || github.ref_name }}",
      'cancel-in-progress': false,
    });
  });

  it('separates read-only packaging, OIDC publication, and release permissions', async () => {
    const publish = await workflow('publish.yml');
    expect(publish.jobs.resolve.permissions).toEqual({contents: 'read'});
    expect(publish.jobs.validate.permissions).toEqual({contents: 'read'});
    expect(publish.jobs.package.permissions).toEqual({contents: 'read'});
    expect(publish.jobs.publish.permissions).toEqual({contents: 'read', 'id-token': 'write'});
    expect(publish.jobs.release.permissions).toEqual({contents: 'write'});
    expect(publish.jobs.validate.uses).toBe('./.github/workflows/ci.yml');
    expect(publish.jobs.validate.with.ref).toBe('${{ needs.resolve.outputs.sha }}');

    for (const job of Object.values(publish.jobs) as Array<Record<string, unknown>>) {
      expect(job).not.toHaveProperty('environment');
    }

    const jobs = Object.values(publish.jobs) as Array<{
      steps?: Array<{uses?: string; with?: Record<string, unknown>}>;
    }>;
    const checkouts = jobs
      .flatMap((job) => job.steps ?? [])
      .filter((step) => step.uses === 'actions/checkout@v4');
    expect(checkouts.length).toBeGreaterThan(0);
    expect(checkouts.every((step) => step.with?.['persist-credentials'] === false)).toBe(true);
    expect(publish.jobs.publish.steps.some((step: {uses?: string}) => step.uses === 'actions/checkout@v4')).toBe(false);

    const source = await workflowSource('publish.yml');
    for (const prohibited of ['NPM_TOKEN', 'NODE_AUTH_TOKEN', 'registry-url', '_authToken', 'environment:']) {
      expect(source).not.toContain(prohibited);
    }
  });

  it('sources policy from the default branch and binds every critical boundary to the release SHA', async () => {
    const publish = await workflow('publish.yml');
    const resolve = publish.jobs.resolve;
    const checkout = resolve.steps.find((step: {uses?: string}) => step.uses === 'actions/checkout@v4');
    expect(checkout.with).toMatchObject({
      ref: '${{ github.event.repository.default_branch }}',
      'fetch-depth': 0,
      'persist-credentials': false,
    });
    expect(resolve.env).toMatchObject({
      DEFAULT_BRANCH: '${{ github.event.repository.default_branch }}',
      EVENT_NAME: '${{ github.event_name }}',
      EVENT_REF: '${{ github.ref }}',
      TRIGGER_SHA: '${{ github.sha }}',
    });

    const resolveRun = jobRuns(resolve).join('\n');
    expect(resolveRun).toContain('[ "$EVENT_REF" != "refs/heads/$DEFAULT_BRANCH" ]');
    expect(resolveRun).toContain('cp scripts/release-metadata.mjs "$helper"');
    expect(resolveRun.indexOf('cp scripts/release-metadata.mjs "$helper"')).toBeLessThan(
      resolveRun.indexOf('git checkout --detach "$sha"'),
    );
    expect(resolveRun).toContain('[ "$sha" != "$TRIGGER_SHA" ]');

    const source = await workflowSource('publish.yml');
    expect((source.match(/git ls-remote --tags "\$REMOTE_URL"/g) ?? []).length).toBe(3);
    expect((source.match(/"refs\/tags\/\$RELEASE_TAG\^\{\}"/g) ?? []).length).toBe(3);
    expect((source.match(/awk '\$2 ~ \/\\\^\\\{\\\}\$\//g) ?? []).length).toBe(3);
    expect((source.match(/\[ "\$remote_sha" != "\$RELEASE_SHA" \]/g) ?? []).length).toBe(3);
  });

  it('packs once and orders validation, packaging, publication, verification, and release', async () => {
    const publish = await workflow('publish.yml');
    expect(publish.jobs.package.needs).toEqual(['resolve', 'validate']);
    expect(publish.jobs.publish.needs).toEqual(['resolve', 'package']);
    expect(publish.jobs.release.needs).toEqual(['resolve', 'publish']);

    for (const jobName of ['resolve', 'package', 'publish']) {
      const setupNode = publish.jobs[jobName].steps.find(
        (step: {uses?: string}) => step.uses === 'actions/setup-node@v4',
      );
      expect(setupNode.with['node-version']).toBe('24.15.0');
    }

    const source = await workflowSource('publish.yml');
    expect((source.match(/npm install --global npm@12\.0\.2/g) ?? []).length).toBe(2);
    expect((source.match(/npm pack \.\/packages\/cli/g) ?? []).length).toBe(1);
    expect(source).toContain('actions/upload-artifact@v4');
    expect(source).toContain('actions/download-artifact@v4');
    expect(source).toContain('package.tgz');
    expect(source).toContain('package.integrity');
    expect(source).toContain('npm publish "$tarball" --dry-run');
    expect(source).toContain('npm publish "$tarball" --access public');

    const publishStepNames = publish.jobs.publish.steps.map((step: {name?: string}) => step.name);
    expect(publishStepNames.indexOf('Publish through npm Trusted Publishing')).toBeLessThan(
      publishStepNames.indexOf('Verify public registry and installed CLI'),
    );
  });

  it('accepts existing versions and duplicate races only for exact tarball integrity', async () => {
    const source = await workflowSource('publish.yml');
    expect((source.match(/dist\.integrity/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect((source.match(/\[ "\$registry_integrity" = "\$local_integrity" \]/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(source).toContain('Artifact integrity does not match package.integrity');
    expect(source).toContain('Registry integrity collision');
    expect(source).toContain('for race_attempt in $(seq 1 6); do');
    expect(source).toContain('$RUNNER_TEMP/npm-publish-race-$race_attempt');
    expect(source).toContain('exit "$publish_status"');
    expect(source).not.toContain("grep -Eq 'previously published|cannot publish over|E403'");
  });

  it('keeps shell expressions indirect and retries failed clean-cache CLI installs within the bound', async () => {
    const publish = await workflow('publish.yml');
    const runs = Object.values(publish.jobs).flatMap((job) => jobRuns(job as {steps?: Array<{run?: string}>}));
    expect(runs.length).toBeGreaterThan(0);
    expect(runs.every((run) => !run.includes('${{'))).toBe(true);

    const verify = publish.jobs.publish.steps.find(
      (step: {name?: string}) => step.name === 'Verify public registry and installed CLI',
    ).run;
    expect(verify).toContain('for attempt in $(seq 1 18); do');
    expect(verify).toContain('sleep 10');
    expect(verify).toContain('$RUNNER_TEMP/npm-registry-$attempt');
    expect(verify).toContain('$RUNNER_TEMP/npm-cli-$attempt');
    expect(verify).toMatch(/if cli_version="\$\(npx .* cartographymd --version 2>\/dev\/null\)"; then/);
    expect(verify).not.toMatch(/^\s*cli_version="\$\(npx/m);
  });
});
