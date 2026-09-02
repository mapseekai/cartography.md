import Ajv2020 from 'ajv/dist/2020.js';
import {readFile} from 'node:fs/promises';
import {FORMAT_VERSION} from '../src/version.js';
const schema = JSON.parse(await readFile(new URL('../../../schema/cartography-front-matter.schema.json', import.meta.url), 'utf8'));
new Ajv2020({strict: false}).compile(schema);
if (schema.$id !== `urn:cartography-md:schema:front-matter:${FORMAT_VERSION}`) throw new Error('Unexpected schema $id.');
if (schema.properties?.version?.const !== FORMAT_VERSION) throw new Error('Schema version does not match format version.');
