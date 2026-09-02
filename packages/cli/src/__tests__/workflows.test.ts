import {readFile} from 'node:fs/promises';
import {describe, expect, it} from 'vitest';
import {parse} from 'yaml';

const repositoryRoot = new URL('../../../..', import.meta.url);
async function workflow(name: string) {
  return parse(await readFile(new URL(`.github/workflows/${name}`, repositoryRoot), 'utf8'));
}

describe('GitHub workflows', () => {
  it('keeps CI triggers and exposes a reusable ref input', async () => {
    const ci = await workflow('ci.yml');
    expect(ci.on.push.branches).toEqual(['main']);
    expect(ci.on).toHaveProperty('pull_request');
    expect(ci.on.workflow_call.inputs.ref).toMatchObject({required: false, type: 'string'});
    expect(ci.jobs.test.strategy.matrix['node-version']).toEqual([20, 22]);
  });

  it('publishes tags through OIDC without a long-lived npm token', async () => {
    const publish = await workflow('publish.yml');
    expect(publish.on.push.tags).toEqual(['v*']);
    expect(publish.on.workflow_dispatch.inputs.tag).toMatchObject({required: true, type: 'string'});
    expect(publish.jobs.validate.uses).toBe('./.github/workflows/ci.yml');
    expect(publish.jobs.publish.permissions).toMatchObject({'id-token': 'write', contents: 'write'});
    const source = await readFile(new URL('.github/workflows/publish.yml', repositoryRoot), 'utf8');
    expect(source).not.toContain('NPM_TOKEN');
    expect(source).toContain('npm publish ./packages/cli');
    expect(source).toContain('cartographymd --version');
  });
});
