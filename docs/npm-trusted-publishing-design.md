# npm Trusted Publishing design

**Status:** Approved

**Date:** 2026-09-02

## Goal

Publish `@mapseekai/cartography.md` from GitHub Actions without a long-lived
`NPM_TOKEN` or a per-release OTP. A pushed SemVer tag is the release authority:
the workflow validates the tagged commit, publishes the matching npm version,
verifies that the public registry can install it, and then creates the matching
GitHub Release.

## Scope

This design adds one release workflow, makes the existing CI workflow reusable,
declares public npm access in the publishable package, and documents operator
setup. It does not publish the private workspace root or either private Skill
package.

## Release contract

- Stable tags such as `v0.4.0` publish to the npm `latest` dist-tag and create a
  normal GitHub Release.
- Prerelease tags such as `v0.4.0-beta.1` and `v0.4.0-rc.1` publish to the npm
  `next` dist-tag and create a GitHub prerelease.
- The Git tag, root `package.json`, `packages/cli/package.json`, and
  `packages/cli/src/version.ts` must declare the same version.
- The tag must be valid SemVer with a leading `v`.
- A manual `workflow_dispatch` input accepts an existing tag for bounded retry.
  It is not a path for inventing a version that has no Git tag.
- npm versions and GitHub Releases are immutable from this workflow. Existing
  artifacts are verified or skipped; they are never overwritten.

## Workflow architecture

### Reusable CI

`.github/workflows/ci.yml` keeps its current `push` and `pull_request` triggers
and adds `workflow_call`. The same Node 20 and Node 22 matrix therefore gates
pull requests, main, and releases without copying validation commands.

### Publish workflow

`.github/workflows/publish.yml` has two entry points:

```yaml
on:
  push:
    tags: ['v*']
  workflow_dispatch:
    inputs:
      tag:
        required: true
        type: string
```

The workflow uses one concurrency group per release tag and does not cancel an
in-progress publication. It contains these jobs:

1. `validate` calls the reusable CI workflow at the tagged commit.
2. `publish` checks out the same tag, derives the version/channel, rebuilds the
   publishable package, performs an npm dry-run, and publishes through OIDC.
3. The same job polls the public npm packument with a fixed attempt limit and
   executes `cartographymd --version` through a clean temporary cache.
4. Only after registry verification does the job create the GitHub Release with
   the preinstalled `gh` CLI. An existing release is left unchanged.

## npm Trusted Publisher

The package is configured on npmjs.com with these exact claims:

| Field | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `mapseekai` |
| Repository | `cartography.md` |
| Workflow filename | `publish.yml` |
| Environment | empty |

The workflow grants only the permissions required by its jobs:

```yaml
permissions:
  contents: write
  id-token: write
```

`id-token: write` lets npm exchange the GitHub OIDC assertion for a short-lived
publish credential. No `NPM_TOKEN` secret is created. The publishable package
declares `publishConfig.access: public`, and the workflow also passes
`--access public` defensively for the first scoped-package publication.

The publish job uses a GitHub-hosted runner and a pinned Node/npm combination
that supports npm Trusted Publishing. The package's runtime contract remains
Node 20 or newer; the newer Node version is only the release toolchain.

## Idempotency and failure handling

- If metadata validation fails, no registry or GitHub mutation occurs.
- If CI fails, publication does not start.
- Before publishing, the job checks whether the exact npm version exists. If it
  exists, upload is skipped and public installation verification still runs.
- If `npm publish` reports that the version already exists, the workflow treats
  it as a retry only after registry lookup confirms the same version.
- Registry propagation is polled with a bounded retry loop. Exhaustion fails the
  workflow and prevents GitHub Release creation.
- npm `404` immediately after publication is treated as propagation delay only
  while the bounded retry is active; it is never reported as a completed
  release without a successful clean install.
- GitHub Release creation uses the exact tag. Stable tags create normal
  releases; prerelease tags pass `--prerelease`.
- A pre-existing GitHub Release is verified and skipped rather than edited.
- The workflow never force-moves tags, unpublishes npm versions, or overwrites
  an existing version.

## Files

- Modify `.github/workflows/ci.yml` to add `workflow_call`.
- Create `.github/workflows/publish.yml` for tag/manual release orchestration.
- Modify `packages/cli/package.json` to add `publishConfig.access`.
- Modify `CONTRIBUTING.md` with release and npm Trusted Publisher setup.

## Verification

Local verification before committing:

1. Confirm package manifests and the tag-version comparison for stable,
   prerelease, malformed, and mismatched tags.
2. Run `pnpm install --frozen-lockfile`.
3. Run the complete existing validation sequence in the same build-before-test
   order used by CI.
4. Run `npm publish ./packages/cli --dry-run --access public`.
5. Run GitNexus `detect_changes` and require a complete, non-truncated result.

Repository verification after pushing:

1. Confirm GitHub parses and lists `publish.yml`.
2. Configure the npm Trusted Publisher with the exact table above.
3. Run `workflow_dispatch` for the existing `v0.3.0` tag as an idempotency test.
4. Confirm the workflow either verifies the existing npm version or fails
   without creating contradictory GitHub state.
5. Use a future prerelease tag to prove the OIDC upload and `next` channel path.

## Acceptance criteria

- A valid stable tag publishes the matching package to `latest` without a token
  or OTP and creates a normal GitHub Release after installation verification.
- A valid prerelease tag publishes to `next` and creates a GitHub prerelease.
- A malformed or mismatched tag fails before publication.
- Re-running the workflow for an existing version does not overwrite npm or
  duplicate the GitHub Release.
- Registry propagation delay cannot produce a false-success workflow.
- Existing pull-request and main-branch CI behavior remains intact.
