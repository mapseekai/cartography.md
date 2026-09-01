import type { Consolidated, ConsolidatedElement, TypographyToken } from './consolidate.js';
import type { Dimension, ExtractedStyle } from './ir.js';

type YamlScalar = string | number;
type YamlValue = YamlScalar | YamlValue[] | { [key: string]: YamlValue };

const tokenReference = /^\{[A-Za-z0-9_.\-[\]]+\}$/;
const dimension = /^\d+(?:\.\d+)?(?:px|pt|mm|cm|in)$/;

function formatDimension({ value, unit }: Dimension): string {
  return `${value}${unit}`;
}

function quoted(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function scalar(value: YamlScalar, inArray = false): string {
  if (typeof value === 'number') return String(value);
  return inArray || value === '0.3.0' || dimension.test(value) || tokenReference.test(value) || /[:#{}"']/.test(value)
    ? quoted(value)
    : value;
}

/** Emits the intentionally small YAML subset used by CARTOGRAPHY.md front matter. */
function emitYaml(value: YamlValue, indent = 0): string[] {
  if (Array.isArray(value)) return [`[${value.map(item => {
    if (typeof item === 'object' && item !== null) throw new Error('YAML arrays only support scalars');
    return scalar(item as YamlScalar, true);
  }).join(', ')}]`];
  if (typeof value !== 'object' || value === null) return [scalar(value)];

  const lines: string[] = [];
  for (const [key, child] of Object.entries(value)) {
    const prefix = `${' '.repeat(indent)}${key}:`;
    if (typeof child === 'object' && child !== null && !Array.isArray(child)) {
      lines.push(prefix, ...emitYaml(child, indent + 2));
    } else {
      lines.push(`${prefix} ${emitYaml(child, indent)[0]}`);
    }
  }
  return lines;
}

function typographyYaml(token: TypographyToken): YamlValue {
  return {
    fontFamily: token.fontFamily,
    fontSize: formatDimension(token.fontSize),
    ...(token.fontWeight === undefined ? {} : { fontWeight: token.fontWeight }),
    ...(token.letterSpacing === undefined ? {} : { letterSpacing: formatDimension(token.letterSpacing) }),
    ...(token.lineHeight === undefined
      ? {}
      : { lineHeight: typeof token.lineHeight === 'number' ? token.lineHeight : formatDimension(token.lineHeight) }),
    ...(token.textTransform === undefined ? {} : { textTransform: token.textTransform }),
  };
}

function elementYaml(element: ConsolidatedElement): YamlValue {
  const style: Record<string, YamlValue> = {};
  for (const [property, token] of Object.entries(element.style)) {
    if (Array.isArray(token)) style[property] = token;
    else if (token) {
      const group = property === 'typography' ? 'typography'
        : property === 'dash' ? 'dashes'
          : ['color', 'fillColor', 'strokeColor', 'outlineColor', 'casingColor', 'haloColor'].includes(property) ? 'colors'
            : ['strokeWidth', 'outlineWidth', 'casingWidth', 'haloWidth', 'size', 'offset', 'spacing'].includes(property) ? 'widths'
              : ['opacity', 'fillOpacity', 'strokeOpacity'].includes(property) ? 'opacities'
                : undefined;
      style[property] = group ? `{${group}.${token}}` : token;
    }
  }

  return {
    geometry: element.geometry,
    ...(element.family === undefined ? {} : { family: element.family }),
    role: element.role,
    state: element.state,
    ...(element.layerRole === undefined ? {} : { layerRole: element.layerRole }),
    ...style,
  };
}

function section(title: string, body: string[]): string {
  return `## ${title}\n\n${body.join('\n')}`;
}

/**
 * Produces a self-contained CARTOGRAPHY.md draft from consolidated visual facts.
 * Runtime bindings and datasource identities deliberately remain out of the document.
 */
export function emitDocument(c: Consolidated, ir: ExtractedStyle, opts: { name: string }): string {
  const tokens: Record<string, YamlValue> = {};
  if (Object.keys(c.tokens.colors).length) tokens.colors = c.tokens.colors;
  if (Object.keys(c.tokens.widths).length) {
    tokens.widths = Object.fromEntries(Object.entries(c.tokens.widths).map(([name, value]) => [name, formatDimension(value)]));
  }
  if (Object.keys(c.tokens.dashes).length) {
    tokens.dashes = Object.fromEntries(Object.entries(c.tokens.dashes).map(([name, values]) => [name, values.map(formatDimension)]));
  }
  if (Object.keys(c.tokens.opacities).length) tokens.opacities = c.tokens.opacities;
  if (Object.keys(c.tokens.typography).length) {
    tokens.typography = Object.fromEntries(Object.entries(c.tokens.typography).map(([name, value]) => [name, typographyYaml(value)]));
  }

  const frontMatter: YamlValue = {
    version: '0.3.0',
    name: opts.name,
    ...tokens,
    elements: Object.fromEntries(c.elements.map(element => [element.name, elementYaml(element)])),
  };
  const sourceName = ir.source.name ?? opts.name;
  const lineElements = c.elements.filter(element => element.geometry === 'line');
  const primaryLine = lineElements[0];
  const lineStyle = primaryLine?.style;
  const inferredLine = primaryLine && lineStyle?.strokeColor && lineStyle.strokeWidth
    ? `主要线要素使用 \`{colors.${lineStyle.strokeColor}}\` 与 \`{widths.${lineStyle.strokeWidth}}\`。`
    : '> TODO(agent): 说明主要线要素的视觉层级。';
  const colors = Object.keys(c.tokens.colors);
  const labels = c.elements.filter(element => element.geometry === 'label');
  const scaleFacts = [...new Set(ir.scaleHints.map(hint => hint.fact))];

  const sections = [
    section('Overview', [
      `来源:${sourceName}`,
      c.elements.length ? `已识别 ${c.elements.length} 个地图元素。` : '> TODO(agent): 说明地图的主题与使用场景。',
      ir.skipped.length ? `有 ${ir.skipped.length} 项样式事实未能转换。` : '> TODO(agent): 说明需要人工确认的视觉意图。',
    ]),
    section('Color', colors.length
      ? [`已提取 ${colors.length} 个颜色 Token：${colors.map(name => `\`{colors.${name}}\``).join('、')}。`, '> TODO(agent): 说明颜色的语义与无障碍对比要求。']
      : ['> TODO(agent): 说明底图、主题与强调色的关系。']),
    section('Typography & Labels', labels.length
      ? [`已识别 ${labels.length} 个标注元素。`, '> TODO(agent): 说明标注优先级、避让与字形策略。']
      : ['> TODO(agent): 说明标注层级与避让策略。']),
    section('Composition & Density', [inferredLine, '> TODO(agent): 说明信息密度、留白与视觉焦点。']),
    section('Layering & Depth', c.elements.some(element => element.layerRole)
      ? [`元素使用 ${[...new Set(c.elements.flatMap(element => element.layerRole ? [element.layerRole] : []))].join('、')} 图层角色。`, '> TODO(agent): 说明图层顺序与遮挡原则。']
      : ['> TODO(agent): 说明图层顺序与深度关系。']),
    section('Geometry & Symbols', c.elements.length
      ? [`已识别几何类型：${[...new Set(c.elements.map(element => element.geometry))].join('、')}。`, '> TODO(agent): 说明符号形状与线面细节。']
      : ['> TODO(agent): 说明几何与符号语言。']),
    section('Scale & Generalization', scaleFacts.length
      ? scaleFacts.map(fact => `- ${fact}`)
      : ['> TODO(agent): 说明各尺度下的取舍与概化规则。']),
    section('Map Elements', c.elements.length
      ? [c.elements.map(element => `\`${element.name}\``).join('、') + ' 是已识别的视觉元素。', '> TODO(agent): 说明元素家族与状态扩展规则。']
      : ['> TODO(agent): 说明应包含的地图元素与视觉组件。']),
    section('Data & Legend', ['> TODO(agent): 说明图例、数据解释与读图提示；运行时数据绑定不写入本文件。']),
  ];

  return `---\n${emitYaml(frontMatter).join('\n')}\n---\n\n${sections.join('\n\n')}\n`;
}
