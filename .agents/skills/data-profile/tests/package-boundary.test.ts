import {readFile} from 'node:fs/promises';

import {describe, expect, it} from 'vitest';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
) as {scripts?: Record<string, string>};

describe('data-profile package boundary', () => {
  it('exposes only runnable current scripts', () => {
    expect(packageJson.scripts).toMatchObject({
      test: 'vitest run',
      typecheck: 'tsc --noEmit -p tsconfig.json',
    });
    expect(packageJson.scripts).not.toHaveProperty('profile');
    expect(Object.values(packageJson.scripts ?? {})).not.toContain('tsx src/profile.ts');
  });
});
