import {readFile} from 'node:fs/promises';
import {describe, expect, it} from 'vitest';
import * as api from '../api.js';

const rootManifestUrl = new URL('../../../../package.json', import.meta.url);
const cliManifestUrl = new URL('../../package.json', import.meta.url);
const schemaUrl = new URL('../../../../schema/cartography-front-matter.schema.json', import.meta.url);

describe('package and format versions', () => {
  it('releases package 0.3.1-rc.1 without changing format 0.3.0', async () => {
    const [rootManifest, cliManifest, schema] = await Promise.all(
      [rootManifestUrl, cliManifestUrl, schemaUrl].map(async (url) => JSON.parse(await readFile(url, 'utf8'))),
    );

    expect(api.VERSION).toBe('0.3.1-rc.1');
    expect(api.FORMAT_VERSION).toBe('0.3.0');
    expect(rootManifest.version).toBe(api.VERSION);
    expect(cliManifest.version).toBe(api.VERSION);
    expect(schema.properties.version.const).toBe(api.FORMAT_VERSION);
    expect(schema.$id).toBe(`urn:cartography-md:schema:front-matter:${api.FORMAT_VERSION}`);
    expect(api.cartographySchema.safeParse({version: api.FORMAT_VERSION, name: 'Test'}).success).toBe(true);
    expect(api.cartographySchema.safeParse({version: api.VERSION, name: 'Test'}).success).toBe(false);
  });
});
