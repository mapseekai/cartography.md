import {rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, '..');

await rm(path.join(packageRoot, 'dist'), {force: true, recursive: true});
