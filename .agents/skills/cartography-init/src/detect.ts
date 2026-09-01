import type { SourceKind } from './ir.js';

/** 扩展名优先,内容嗅探兜底;qgz/zip 由 Task 4 的 qgis 适配器内部再细分。 */
export function detectSource(absPath: string, head: Buffer): SourceKind {
  const lower = absPath.toLowerCase();
  if ((lower.endsWith('.json') || lower.endsWith('.style.json')) && looksLikeStyleJson(head)) {
    return 'style';
  }
  if (lower.endsWith('.qgs') || lower.endsWith('.qgz')) return 'qgis';
  if (lower.endsWith('.lyrx')) return 'lyrx';
  if (lower.endsWith('.stylx')) return 'stylx';
  if (lower.endsWith('.sld') || lower.endsWith('.xml')) {
    if (looksLikeSld(head)) return 'sld';
    if (looksLikeQgs(head)) return 'qgis';
  }
  if (looksLikeStyleJson(head)) return 'style';
  if (looksLikeSld(head)) return 'sld';
  if (looksLikeQgs(head)) return 'qgis';
  if (head.length >= 4 && head.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
    return 'qgis';
  }
  throw new Error(`无法识别的输入格式: ${absPath}`);
}

function looksLikeStyleJson(head: Buffer): boolean {
  const text = head.toString('utf8');
  return text.includes('"layers"') && text.includes('"version"');
}

function looksLikeSld(head: Buffer): boolean {
  return head.toString('utf8').includes('StyledLayerDescriptor');
}

function looksLikeQgs(head: Buffer): boolean {
  return head.toString('utf8').includes('<qgis');
}
