import type {Severity} from '../model/types.js';

export const CANONICAL_SECTIONS = [
  'Overview',
  'Intent & Audience',
  'Visual Hierarchy',
  'Color',
  'Typography & Labels',
  'Geometry & Symbols',
  'Scale & Generalization',
  'Layering & Composition',
  'Interaction States',
  'Accessibility',
  'Review Principles',
  "Do's and Don'ts",
] as const;

export type CanonicalSection = (typeof CANONICAL_SECTIONS)[number];

export const SECTION_SEVERITY: Record<CanonicalSection, Severity> = {
  Overview: 'warning',
  'Intent & Audience': 'warning',
  'Visual Hierarchy': 'warning',
  Color: 'info',
  'Typography & Labels': 'info',
  'Geometry & Symbols': 'info',
  'Scale & Generalization': 'warning',
  'Layering & Composition': 'warning',
  'Interaction States': 'info',
  Accessibility: 'info',
  'Review Principles': 'warning',
  "Do's and Don'ts": 'info',
};

const aliases: Record<string, CanonicalSection> = {
  overview: 'Overview',
  purpose: 'Overview',
  概述: 'Overview',
  目的: 'Overview',
  'map intent': 'Intent & Audience',
  intent: 'Intent & Audience',
  'intent and audience': 'Intent & Audience',
  'intent & audience': 'Intent & Audience',
  '地图意图': 'Intent & Audience',
  '意图与受众': 'Intent & Audience',
  hierarchy: 'Visual Hierarchy',
  'visual hierarchy': 'Visual Hierarchy',
  '视觉层级': 'Visual Hierarchy',
  colors: 'Color',
  color: 'Color',
  色彩: 'Color',
  颜色: 'Color',
  labels: 'Typography & Labels',
  typography: 'Typography & Labels',
  'typography and labels': 'Typography & Labels',
  'typography & labels': 'Typography & Labels',
  '字体与标注': 'Typography & Labels',
  标注: 'Typography & Labels',
  geometry: 'Geometry & Symbols',
  symbols: 'Geometry & Symbols',
  'geometry and symbols': 'Geometry & Symbols',
  'geometry & symbols': 'Geometry & Symbols',
  '几何与符号': 'Geometry & Symbols',
  scale: 'Scale & Generalization',
  generalization: 'Scale & Generalization',
  'scale and generalization': 'Scale & Generalization',
  'scale & generalization': 'Scale & Generalization',
  '比例尺与制图综合': 'Scale & Generalization',
  layering: 'Layering & Composition',
  composition: 'Layering & Composition',
  'layering and composition': 'Layering & Composition',
  'layering & composition': 'Layering & Composition',
  '层叠与构图': 'Layering & Composition',
  states: 'Interaction States',
  'interaction states': 'Interaction States',
  '交互状态': 'Interaction States',
  accessibility: 'Accessibility',
  '无障碍': 'Accessibility',
  review: 'Review Principles',
  'review principles': 'Review Principles',
  '评审原则': 'Review Principles',
  "do's and don'ts": "Do's and Don'ts",
  'dos and donts': "Do's and Don'ts",
  '正反例': "Do's and Don'ts",
  '应该与不应该': "Do's and Don'ts",
};

export function normalizeHeading(heading: string): string {
  const key = heading
    .trim()
    .replace(/[：:]+$/, '')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, ' ')
    .toLowerCase();
  return aliases[key] ?? heading.trim();
}
