/** The nine standard sections, in canonical order (§11.1). */
export const CANONICAL_SECTIONS = [
  'Overview',
  'Colors',
  'Typography & Labels',
  'Composition & Density',
  'Layering & Depth',
  'Geometry & Symbols',
  'Scale & Generalization',
  'Map Elements',
  "Do's and Don'ts",
] as const;

/** Registered aliases per §11.2. */
const SECTION_ALIASES: Record<string, string[]> = {
  Overview: ['overview', 'brand & style', 'brand and style', '概述', '品牌与风格'],
  Colors: ['color', 'colors', '色彩', '颜色'],
  'Typography & Labels': ['typography', 'labels', 'typography and labels', 'typography & labels', '字体', '标注', '字体与标注'],
  'Composition & Density': ['composition', 'density', 'composition and density', 'composition & density', '构图', '密度', '构图与密度'],
  'Layering & Depth': ['layering', 'depth', 'layering and depth', 'layering & depth', '层级', '深度', '层级与深度'],
  'Geometry & Symbols': ['geometry', 'symbols', 'geometry and symbols', 'geometry & symbols', '几何', '符号', '几何与符号'],
  'Scale & Generalization': ['scale', 'generalization', 'scale and generalization', 'scale & generalization', '比例尺', '制图综合', '比例尺与制图综合'],
  'Map Elements': ['elements', 'map elements', 'map components', '地图要素', '地图组件', '要素样式'],
  "Do's and Don'ts": ["do's and don'ts", 'dos and donts', "dos and don'ts", "do's & don'ts", '应该与不应该', '正反例', '设计禁忌'],
};

/**
 * Heading normalization per §11.3: strip inline markup, NFKC, lowercase
 * (the NFKC_Casefold approximation used by this implementation), unify curly
 * apostrophes, then trim and collapse Unicode whitespace.
 */
export function normalizeSectionText(text: string): string {
  return text
    .replace(/`+([^`]+)`+/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/\*\*|__|~~|\*|_/g, '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[''ʼ]/g, "'")
    .trim()
    .replace(/\p{White_Space}+/gu, ' ');
}

const sectionLookup: Record<string, string> = Object.fromEntries(
  Object.entries(SECTION_ALIASES).flatMap(([canonical, names]) =>
    [canonical, ...names].map((name) => [normalizeSectionText(name), canonical]),
  ),
);

/** Resolve heading text to a canonical standard section name, or undefined for unknown headings. */
export function canonicalSectionName(headingText: string): string | undefined {
  return sectionLookup[normalizeSectionText(headingText)];
}

/** `omitted.section` uses the same normalization and alias matching as headings (§5.4). */
export const resolveOmittedSectionName = canonicalSectionName;
