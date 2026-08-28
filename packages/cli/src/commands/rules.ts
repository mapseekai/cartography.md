import {defineCommand} from 'citty';
import {RULE_CATALOG} from '../linter/rule-catalog.js';

export default defineCommand({
  meta: {name: 'rules', description: 'Print the built-in deterministic rule catalog.'},
  run() {
    process.stdout.write(`${JSON.stringify(RULE_CATALOG, null, 2)}\n`);
  },
});
