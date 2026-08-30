import {describe, expect, it} from 'vitest';
import {diffCartography} from '../linter/diff.js';
import {getSpecification} from '../spec.js';
import {CANONICAL_SECTIONS} from '../parser/sections.js';
import {readFileSync} from 'node:fs';

const before = `---
version: "0.2.0"
name: A
tokens: {colors: {text: "#222222"}}
---

## Overview

Before.
`;

describe('diff and bundled metadata', () => {
  it('detects modified resolved values and prose sections', () => {
    const after = before.replace('name: A', 'name: B').replace('Before.', 'After.');
    const report = diffCartography(before, after);
    expect(report.values.modified).toContain('name');
    expect(report.sections.modified).toContain('Overview');
  });

  it('bundles a detailed design specification in both languages', () => {
    const english = getSpecification();
    const chinese = readFileSync(new URL('../../../../docs/spec.zh-CN.md', import.meta.url), 'utf8');

    expect(english).toContain('# CARTOGRAPHY.md Format Specification');
    expect(english).toContain('**Status:** Draft 0.2.0');
    expect(english).toContain('## Design philosophy');
    expect(english).toContain('## Markdown sections');
    expect(english).toContain('## Cross-section design relationships');
    expect(chinese).toContain('# CARTOGRAPHY.md 格式规范');
    expect(chinese).toContain('## 设计理念');
    expect(chinese).toContain('## Markdown 章节');
    expect(chinese).toContain('## 跨章节设计关系');

    for (const field of ['version', 'name', 'description', 'locale', 'tokens', 'accessibility', 'omitted', 'extensions']) {
      expect(english).toContain(`### \`${field}\``);
      expect(chinese).toContain(`### \`${field}\``);
    }

    for (const group of ['colors', 'typography', 'widths', 'opacities']) {
      expect(english).toContain(`### \`${group}\``);
      expect(chinese).toContain(`### \`${group}\``);
    }
    expect(english).toContain('### `widths` and `sizes`');
    expect(chinese).toContain('### `widths` 与 `sizes`');

    for (const section of CANONICAL_SECTIONS) {
      expect(english).toContain(`### \`${section}\``);
      expect(chinese).toContain(`### \`${section}\``);
    }

    expect(english).not.toContain('## Validator model');
    expect(english).not.toContain('## Rule catalog');
    expect(chinese).not.toContain('## Validator 模型');
    expect(chinese).not.toContain('## 规则目录');
  });
});
