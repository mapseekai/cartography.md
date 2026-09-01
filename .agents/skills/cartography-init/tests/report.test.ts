import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkReportTriage, renderReportJson, renderReportMarkdown } from '../src/report.js';
import { consolidate } from '../src/consolidate.js';
import { emptyExtracted } from '../src/ir.js';

function sampleIr() {
  const ir = emptyExtracted({ kind: 'qgis', name: 'Demo' });
  ir.elements.push({ name: 'roads', geometry: 'line', family: 'roads', roleHint: 'primary', style: { strokeColor: '#dd8844' }, scaleHints: [] });
  ir.colors.push({ value: '#dd8844', nameHint: 'roads', usedBy: ['roads'] });
  ir.bindings.push({ source: 'qgis', layer: 'roads', family: 'roads', kind: 'filter', expression: '"highway" = \'primary\'' });
  ir.datasources.push({ source: 'qgis', layer: 'roads', identity: 'ogr:/data/roads.shp', providerType: 'ogr' });
  ir.unresolved.push({ topic: 'target tile source url/type', detail: 'QGIS 工程不含瓦片源定义' });
  ir.skipped.push({ source: 'qgis', layer: 'roads', reason: '嵌套符号层特效' });
  return ir;
}

describe('report', () => {
  it('json backfills symbolRef from the name map', () => {
    const ir = sampleIr();
    const json = JSON.parse(renderReportJson(ir, consolidate(ir)));
    expect(json.bindings[0].symbolRef).toBe('roads');
    expect(json.datasources[0].identity).toContain('ogr:');
    expect(json.unresolved).toHaveLength(1);
  });

  it('markdown lists skipped and a next-steps checklist', () => {
    const md = renderReportMarkdown(sampleIr(), consolidate(sampleIr()));
    expect(md).toContain('嵌套符号层特效');
    expect(md).toContain('bindings');
    expect(md).toContain('补写');
  });

  it('checkReportTriage fails on untriaged bindings and passes after triage', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'report-'));
    const file = path.join(dir, 'INIT_REPORT.json');
    const ir = sampleIr();
    writeFileSync(file, renderReportJson(ir, consolidate(ir)));
    expect(checkReportTriage(file).ok).toBe(false);

    const triaged = JSON.parse(renderReportJson(ir, consolidate(ir)));
    triaged.bindings[0].triage = { decision: 'prose', note: '主干道强调色' };
    writeFileSync(file, JSON.stringify(triaged, null, 2));
    const res = checkReportTriage(file);
    expect(res.ok).toBe(true);
    expect(res.pending).toEqual([]);
  });
});
