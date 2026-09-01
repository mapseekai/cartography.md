import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const TAG_PATTERN = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export function extractSourceVersion(source) {
  const match = /\bVERSION\s*=\s*['"]([^'"]+)['"]/.exec(source);
  if (!match) throw new Error('packages/cli/src/version.ts must export a literal VERSION.');
  return match[1];
}

export function resolveReleaseMetadata(tag, versions) {
  if (!TAG_PATTERN.test(tag)) throw new Error(`Release tag ${tag} is not a valid v-prefixed SemVer.`);
  const version = tag.slice(1);
  const declared = [versions.root, versions.cli, versions.source];
  if (declared.some((item) => item !== version)) {
    throw new Error(`Release version mismatch: tag=${version}, root=${versions.root}, cli=${versions.cli}, source=${versions.source}.`);
  }
  const prerelease = version.includes('-');
  return {version, npmTag: prerelease ? 'next' : 'latest', prerelease};
}

async function main() {
  const tag = process.argv[2];
  if (!tag) throw new Error('Usage: node scripts/release-metadata.mjs <v-prefixed-tag>');
  const [rootText, cliText, sourceText] = await Promise.all([
    readFile('package.json', 'utf8'),
    readFile('packages/cli/package.json', 'utf8'),
    readFile('packages/cli/src/version.ts', 'utf8'),
  ]);
  const metadata = resolveReleaseMetadata(tag, {
    root: JSON.parse(rootText).version,
    cli: JSON.parse(cliText).version,
    source: extractSourceVersion(sourceText),
  });
  process.stdout.write([
    `version=${metadata.version}`,
    `npm_tag=${metadata.npmTag}`,
    `prerelease=${metadata.prerelease}`,
    '',
  ].join('\n'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
