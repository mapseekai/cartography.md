import {spawnSync} from 'node:child_process';
import {chmod, mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {parse} from 'yaml';

const repositoryRoot = new URL('../../../..', import.meta.url);
const repositoryRootPath = fileURLToPath(repositoryRoot);
async function workflowSource(name: string) {
  return readFile(new URL(`.github/workflows/${name}`, repositoryRoot), 'utf8');
}

async function workflow(name: string) {
  return parse(await workflowSource(name));
}

function jobRuns(job: {steps?: Array<{run?: string}>}): string[] {
  return (job.steps ?? []).flatMap((step) => (typeof step.run === 'string' ? [step.run] : []));
}

function namedRun(job: {steps?: Array<{name?: string; run?: string}>}, name: string): string {
  const run = job.steps?.find((step) => step.name === name)?.run;
  if (!run) throw new Error(`Workflow step ${name} has no run block.`);
  return run;
}

async function writeExecutable(path: string, source: string) {
  await writeFile(path, `${source}\n`);
  await chmod(path, 0o755);
}

function runBash(source: string, env: NodeJS.ProcessEnv) {
  return spawnSync('bash', ['-c', source], {
    cwd: repositoryRootPath,
    encoding: 'utf8',
    env: {...process.env, ...env},
  });
}

async function runPublishScenario(source: string, scenario: string, eventName: 'push' | 'workflow_dispatch') {
  const root = await mkdtemp(join(tmpdir(), 'cartography-publish-test-'));
  try {
    const fakeBin = join(root, 'bin');
    const runnerTemp = join(root, 'runner');
    const artifactDir = join(runnerTemp, 'npm-package');
    const callsPath = join(root, 'npm-calls');
    const statePath = join(root, 'npm-state');
    await mkdir(fakeBin);
    await mkdir(artifactDir, {recursive: true});
    await writeFile(join(artifactDir, 'package.tgz'), 'fixture tarball');
    await writeFile(join(artifactDir, 'package.integrity'), 'sha512-local\n');
    await writeExecutable(join(fakeBin, 'sleep'), [
      '#!/usr/bin/env bash',
      'exit 0',
    ].join('\n'));
    await writeExecutable(join(fakeBin, 'npm'), [
      '#!/usr/bin/env bash',
      'set -euo pipefail',
      'printf \'%s\\n\' "$*" >> "$NPM_CALL_LOG"',
      'case "$1" in',
      '  view)',
      '    count=0',
      '    if [ -f "$NPM_STATE" ]; then IFS= read -r count < "$NPM_STATE"; fi',
      '    count=$((count + 1))',
      '    printf \'%s\\n\' "$count" > "$NPM_STATE"',
      '    case "$NPM_SCENARIO" in',
      '      exact) printf \'%s\\n\' "$LOCAL_INTEGRITY" ;;',
      '      mismatch) printf \'%s\\n\' \'sha512-remote\' ;;',
      '      transient-mismatch)',
      '        if [ "$count" -eq 1 ]; then',
      '          echo \'npm error code E404 - 404 Not Found\' >&2',
      '          exit 1',
      '        fi',
      '        printf \'%s\\n\' \'sha512-remote\'',
      '        ;;',
      '      absent)',
      '        echo \'npm error code E404 - 404 Not Found\' >&2',
      '        exit 1',
      '        ;;',
      '      *) echo "unexpected npm scenario: $NPM_SCENARIO" >&2; exit 2 ;;',
      '    esac',
      '    ;;',
      '  publish) exit 0 ;;',
      '  *) echo "unexpected npm command: $*" >&2; exit 2 ;;',
      'esac',
    ].join('\n'));

    const result = runBash(source, {
      EVENT_NAME: eventName,
      LOCAL_INTEGRITY: 'sha512-local',
      NPM_CALL_LOG: callsPath,
      NPM_SCENARIO: scenario,
      NPM_STATE: statePath,
      NPM_TAG: 'latest',
      PACKAGE_NAME: '@mapseekai/cartography.md',
      PATH: `${fakeBin}:${process.env.PATH ?? ''}`,
      RELEASE_VERSION: '0.3.0',
      RUNNER_TEMP: runnerTemp,
    });
    const calls = await readFile(callsPath, 'utf8').catch(() => '');
    return {calls, status: result.status, stderr: result.stderr, stdout: result.stdout};
  } finally {
    await rm(root, {recursive: true, force: true});
  }
}

async function runReleaseScenario(source: string, scenario: string) {
  const root = await mkdtemp(join(tmpdir(), 'cartography-release-test-'));
  try {
    const fakeBin = join(root, 'bin');
    const callsPath = join(root, 'gh-calls');
    await mkdir(fakeBin);
    await writeExecutable(join(fakeBin, 'gh'), [
      '#!/usr/bin/env bash',
      'set -euo pipefail',
      'printf \'%s\\n\' "$*" >> "$GH_CALL_LOG"',
      'if [ "$1" = "release" ] && [ "$2" = "view" ]; then',
      '  case "$GH_SCENARIO" in',
      '    correct) printf \'v0.3.0\\tfalse\\tfalse\\n\' ;;',
      '    wrong-tag) printf \'v9.9.9\\tfalse\\tfalse\\n\' ;;',
      '    draft) printf \'v0.3.0\\ttrue\\tfalse\\n\' ;;',
      '    wrong-prerelease) printf \'v0.3.0\\tfalse\\ttrue\\n\' ;;',
      '    absent) echo \'release not found\' >&2; exit 1 ;;',
      '    *) echo "unexpected gh scenario: $GH_SCENARIO" >&2; exit 2 ;;',
      '  esac',
      '  exit 0',
      'fi',
      'if [ "$1" = "release" ] && [ "$2" = "create" ]; then exit 0; fi',
      'echo "unexpected gh command: $*" >&2',
      'exit 2',
    ].join('\n'));

    const result = runBash(source, {
      GH_CALL_LOG: callsPath,
      GH_SCENARIO: scenario,
      PATH: `${fakeBin}:${process.env.PATH ?? ''}`,
      PRERELEASE: 'false',
      RELEASE_TAG: 'v0.3.0',
      REPOSITORY: 'mapseekai/cartography.md',
      RUNNER_TEMP: root,
    });
    const calls = await readFile(callsPath, 'utf8').catch(() => '');
    return {calls, status: result.status, stderr: result.stderr, stdout: result.stdout};
  } finally {
    await rm(root, {recursive: true, force: true});
  }
}

describe('GitHub workflows', () => {
  it('keeps CI triggers and exposes a reusable ref input', async () => {
    const ci = await workflow('ci.yml');
    expect(ci.on.push.branches).toEqual(['main']);
    expect(ci.on).toHaveProperty('pull_request');
    expect(ci.on.workflow_call.inputs.ref).toMatchObject({required: false, type: 'string'});
    expect(ci.jobs.test.strategy.matrix['node-version']).toEqual([20, 22]);
  });

  it('runs release metadata tests only when the checked-out ref contains them', async () => {
    const ci = await workflow('ci.yml');
    const releaseTest = ci.jobs.test.steps.find((step: {run?: string}) => step.run === 'pnpm test:release');
    expect(releaseTest).toMatchObject({
      if: "${{ hashFiles('scripts/release-metadata.test.mjs') != '' }}",
      run: 'pnpm test:release',
    });
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

  it('parses both npm 12 keyed and legacy array pack results and requires exactly one package', async () => {
    const publish = await workflow('publish.yml');
    const pack = namedRun(publish.jobs.package, 'Pack publishable tarball once');
    const root = await mkdtemp(join(tmpdir(), 'cartography-pack-test-'));
    try {
      const fakeBin = join(root, 'bin');
      await mkdir(fakeBin);
      await writeExecutable(join(fakeBin, 'npm'), [
        '#!/usr/bin/env bash',
        'set -euo pipefail',
        'if [ "$1" != "pack" ]; then echo "expected npm pack" >&2; exit 2; fi',
        'shift',
        'destination=""',
        'while [ "$#" -gt 0 ]; do',
        '  case "$1" in',
        '    --pack-destination) destination="$2"; shift 2 ;;',
        '    *) shift ;;',
        '  esac',
        'done',
        'filename="mapseekai-cartography.md-0.3.0.tgz"',
        'printf \'fixture-%s\' "$PACK_SHAPE" > "$destination/$filename"',
        'case "$PACK_SHAPE" in',
        '  array) printf \'[{"filename":"%s","integrity":"sha512-fixture"}]\\n\' "$filename" ;;',
        '  keyed) printf \'{"@mapseekai/cartography.md@0.3.0":{"filename":"%s","integrity":"sha512-fixture"}}\\n\' "$filename" ;;',
        '  multiple) printf \'[{"filename":"%s","integrity":"sha512-fixture"},{"filename":"other.tgz","integrity":"sha512-other"}]\\n\' "$filename" ;;',
        '  *) echo "unexpected pack shape: $PACK_SHAPE" >&2; exit 2 ;;',
        'esac',
      ].join('\n'));

      for (const shape of ['array', 'keyed']) {
        const runnerTemp = join(root, shape);
        await mkdir(runnerTemp);
        const result = runBash(pack, {
          PACK_SHAPE: shape,
          PATH: `${fakeBin}:${process.env.PATH ?? ''}`,
          RUNNER_TEMP: runnerTemp,
        });
        expect({status: result.status, stderr: result.stderr}).toEqual({status: 0, stderr: ''});
        expect(await readFile(join(runnerTemp, 'package.tgz'), 'utf8')).toBe(`fixture-${shape}`);
        expect(await readFile(join(runnerTemp, 'package.integrity'), 'utf8')).toBe('sha512-fixture\n');
      }

      const runnerTemp = join(root, 'multiple');
      await mkdir(runnerTemp);
      const result = runBash(pack, {
        PACK_SHAPE: 'multiple',
        PATH: `${fakeBin}:${process.env.PATH ?? ''}`,
        RUNNER_TEMP: runnerTemp,
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('exactly one package result');
    } finally {
      await rm(root, {recursive: true, force: true});
    }
  });

  it('validates the exact packed tarball contract before artifact upload', async () => {
    const publish = await workflow('publish.yml');
    const packageSteps = publish.jobs.package.steps as Array<{name?: string; uses?: string; run?: string}>;
    const packIndex = packageSteps.findIndex((step) => step.name === 'Pack publishable tarball once');
    const contractIndex = packageSteps.findIndex((step) => step.name === 'Validate packed tarball contract');
    const uploadIndex = packageSteps.findIndex((step) => step.uses === 'actions/upload-artifact@v4');
    expect(packIndex).toBeGreaterThan(-1);
    expect(contractIndex).toBeGreaterThan(packIndex);
    expect(uploadIndex).toBeGreaterThan(contractIndex);

    const contract = packageSteps[contractIndex]?.run ?? '';
    for (const required of [
      'LICENSE',
      'README.md',
      'dist/api.js',
      'dist/api.d.ts',
      'dist/cli.js',
      'dist/spec.md',
      'dist/schema-json/cartography-front-matter.schema.json',
      'dist/version.js',
      'package.json',
    ]) {
      expect(contract).toContain(required);
    }
    expect(contract).toContain('tar -tzf "$tarball"');
    expect(contract).toContain('tar -xOzf "$tarball" package/package.json');
    expect(contract).toContain('tar -xOzf "$tarball" package/dist/cli.js');
    expect(contract).toContain('tar -xOzf "$tarball" package/dist/version.js');
    expect(contract).toContain('dist/schema-json must contain only cartography-front-matter.schema.json');
    expect(contract).toContain('#!/usr/bin/env node');
    expect(contract).toContain('@mapseekai/cartography.md');
    expect(contract).toContain('rootManifest.version');
    expect(contract).toContain('cliManifest.version');
    expect(contract).toContain('const compiledMatches =');
    expect(contract).toContain('compiledMatches.length === 1');
    expect(contract).toContain('const compiledVersion =');
    expect(contract).toContain('compiledVersion !== releaseVersion');
    expect(contract).toContain('dist/version.js must export a literal VERSION equal to RELEASE_VERSION');
    expect(contract).toContain('RELEASE_VERSION');
    expect(contract).toContain('cartography.md');
    expect(contract).toContain('cartographymd');
    expect(contract).toContain('./dist/cli.js');
    expect(contract).toContain('data-profile|profile|style');
    expect(contract).toContain('Publishable stale 0.1 artifacts found');

    const source = await workflowSource('publish.yml');
    expect((source.match(/npm pack \.\/packages\/cli/g) ?? []).length).toBe(1);
    expect(source).not.toContain('check-package');
  });

  it('accepts the built version module with distinct package and format exports', async () => {
    const publish = await workflow('publish.yml');
    const pack = namedRun(publish.jobs.package, 'Pack publishable tarball once');
    const contract = namedRun(publish.jobs.package, 'Validate packed tarball contract');
    const runnerTemp = await mkdtemp(join(tmpdir(), 'cartography-version-contract-'));
    try {
      const packResult = runBash(pack, {RUNNER_TEMP: runnerTemp});
      expect({status: packResult.status, stderr: packResult.stderr}).toEqual({status: 0, stderr: ''});

      const contractResult = runBash(contract, {
        RELEASE_VERSION: '0.3.1-rc.1',
        RUNNER_TEMP: runnerTemp,
      });
      expect({status: contractResult.status, stderr: contractResult.stderr}).toEqual({status: 0, stderr: ''});
    } finally {
      await rm(runnerTemp, {recursive: true, force: true});
    }
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

  it('skips every publish command for an existing exact-integrity version', async () => {
    const publish = await workflow('publish.yml');
    const result = await runPublishScenario(
      namedRun(publish.jobs.publish, 'Publish through npm Trusted Publishing'),
      'exact',
      'workflow_dispatch',
    );
    expect({status: result.status, stderr: result.stderr}).toEqual({status: 0, stderr: ''});
    expect(result.stdout).toContain('already exists with the exact tarball');
    expect(result.calls).not.toMatch(/^publish /m);
  });

  it('retries a transient 404 and rejects a later integrity mismatch before dry-run', async () => {
    const publish = await workflow('publish.yml');
    const result = await runPublishScenario(
      namedRun(publish.jobs.publish, 'Publish through npm Trusted Publishing'),
      'transient-mismatch',
      'push',
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Registry integrity collision');
    expect(result.calls.match(/^view /gm)).toHaveLength(2);
    expect(result.calls).not.toMatch(/^publish /m);
  });

  it('keeps manual dispatch verify-only when the npm version is absent', async () => {
    const publish = await workflow('publish.yml');
    const result = await runPublishScenario(
      namedRun(publish.jobs.publish, 'Publish through npm Trusted Publishing'),
      'absent',
      'workflow_dispatch',
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Manual dispatch can only verify an already-published exact-integrity version');
    expect(result.calls).not.toMatch(/^publish /m);
  });

  it('dry-runs an absent version before allowing a tag-push upload', async () => {
    const publish = await workflow('publish.yml');
    const result = await runPublishScenario(
      namedRun(publish.jobs.publish, 'Publish through npm Trusted Publishing'),
      'absent',
      'push',
    );
    expect({status: result.status, stderr: result.stderr}).toEqual({status: 0, stderr: ''});
    const publishes = result.calls.split('\n').filter((call) => call.startsWith('publish '));
    expect(publishes).toHaveLength(2);
    expect(publishes[0]).toContain('--dry-run');
    expect(publishes[1]).not.toContain('--dry-run');
    expect(publishes[1]).toContain('--provenance');
  });

  it('strictly verifies immutable existing GitHub Release metadata', async () => {
    const publish = await workflow('publish.yml');
    const release = namedRun(publish.jobs.release, 'Create GitHub Release if absent');
    const correct = await runReleaseScenario(release, 'correct');
    expect({status: correct.status, stderr: correct.stderr}).toEqual({status: 0, stderr: ''});
    expect(correct.stdout).toContain('already exists with matching immutable metadata');
    expect(correct.calls).not.toContain('release create');

    for (const [scenario, field] of [
      ['wrong-tag', 'tagName'],
      ['draft', 'isDraft'],
      ['wrong-prerelease', 'isPrerelease'],
    ] as const) {
      const mismatch = await runReleaseScenario(release, scenario);
      expect(mismatch.status).not.toBe(0);
      expect(mismatch.stderr).toContain(field);
      expect(mismatch.calls).not.toContain('release create');
    }
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
