export interface CommentState {
  inComment: boolean;
}

/** Mask `<!-- ... -->` spans line by line, preserving line lengths; state carries across lines. */
export function maskHtmlComments(line: string, state: CommentState): string {
  let output = '';
  let cursor = 0;
  while (cursor < line.length) {
    if (state.inComment) {
      const end = line.indexOf('-->', cursor);
      if (end < 0) return output + ' '.repeat(line.length - cursor);
      output += ' '.repeat(end + 3 - cursor);
      cursor = end + 3;
      state.inComment = false;
    } else {
      const start = line.indexOf('<!--', cursor);
      if (start < 0) return output + line.slice(cursor);
      output += line.slice(cursor, start) + '    ';
      cursor = start + 4;
      state.inComment = true;
    }
  }
  return output;
}

const blank = (text: string) => text.replace(/[^\n]/g, ' ');

/** CommonMark block-level tag names (HTML block type 6). */
const BLOCK_TAGS = new Set([
  'address', 'article', 'aside', 'base', 'basefont', 'blockquote', 'body', 'caption', 'center',
  'col', 'colgroup', 'dd', 'details', 'dialog', 'dir', 'div', 'dl', 'dt', 'fieldset', 'figcaption',
  'figure', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head',
  'header', 'hr', 'html', 'iframe', 'legend', 'li', 'link', 'main', 'menu', 'menuitem', 'nav',
  'noframes', 'ol', 'optgroup', 'option', 'p', 'param', 'search', 'section', 'summary', 'table',
  'tbody', 'td', 'tfoot', 'th', 'thead', 'title', 'tr', 'track', 'ul',
]);

type HtmlBlockKind = 'scriptish' | 'processing' | 'declaration' | 'cdata' | 'tag';

/** Classify a CommonMark HTML block start at line beginning (indent ≤ 3), or return undefined. */
function htmlBlockStart(line: string): {kind: HtmlBlockKind; closer?: RegExp} | undefined {
  const trimmed = /^ {0,3}(.*)$/.exec(line)?.[1];
  if (trimmed === undefined || !trimmed.startsWith('<')) return undefined;
  const scriptish = /^<(script|pre|style)(?=[\s>]|$)/i.exec(trimmed);
  if (scriptish) return {kind: 'scriptish', closer: new RegExp(`</${scriptish[1]!.toLowerCase()}\\s*>`, 'i')};
  if (/^<\?/.test(trimmed)) return {kind: 'processing'};
  if (/^<![A-Za-z]/.test(trimmed)) return {kind: 'declaration'};
  if (/^<!\[CDATA\[/.test(trimmed)) return {kind: 'cdata'};
  const tag = /^<\/?([A-Za-z][A-Za-z0-9-]*)(?=[\s/>]|$)/.exec(trimmed);
  if (tag && BLOCK_TAGS.has(tag[1]!.toLowerCase())) return {kind: 'tag'};
  return undefined;
}

/** Whether an open HTML block ends on this line; `tag` blocks end at a blank line. */
function htmlBlockEnds(line: string, kind: HtmlBlockKind, closer?: RegExp): boolean {
  if (kind === 'tag') return /^\s*$/.test(line);
  if (kind === 'processing') return line.includes('?>');
  if (kind === 'declaration') return line.includes('>');
  if (kind === 'cdata') return line.includes(']]>');
  return closer !== undefined && closer.test(line);
}

/**
 * Mask everything §10.3 excludes from reference scanning, preserving line
 * structure: fenced and indented code, HTML blocks and comments, reference
 * definitions, inline code spans, inline HTML tag syntax, link destinations
 * and titles, reference labels, and backslash-escaped braces. Visible text —
 * including text between paired inline tags — stays scannable.
 */
export function maskMarkdownReferenceLiterals(markdown: string): string {
  const lines = markdown.split('\n');
  let fence: {marker: string; length: number} | undefined;
  let htmlBlock: {kind: HtmlBlockKind; closer?: RegExp} | undefined;
  let inComment = false;
  return lines
    .map((original) => {
      let line = original;
      if (inComment) {
        const end = line.indexOf('-->');
        if (end < 0) return blank(line);
        line = ' '.repeat(end + 3) + line.slice(end + 3);
        inComment = false;
      }
      if (fence) {
        const closing = new RegExp(`^ {0,3}${fence.marker}{${fence.length},}[ \\t]*$`);
        if (closing.test(line)) fence = undefined;
        return blank(line);
      }
      const fenceOpen = /^ {0,3}(`{3,}|~{3,})/.exec(line);
      if (fenceOpen?.[1]) {
        fence = {marker: fenceOpen[1][0]!, length: fenceOpen[1].length};
        return blank(line);
      }
      if (htmlBlock) {
        if (htmlBlockEnds(line, htmlBlock.kind, htmlBlock.closer)) htmlBlock = undefined;
        return blank(line);
      }
      const blockStart = htmlBlockStart(line);
      if (blockStart) {
        if (!htmlBlockEnds(line, blockStart.kind, blockStart.closer)) htmlBlock = blockStart;
        return blank(line);
      }
      if (/^(?: {4}|\t)/.test(line)) return blank(line);
      if (/^ {0,3}\[[^\]]+\]:/.test(line)) return blank(line);

      line = line.replace(/`+[^`]*`+/g, (match) => blank(match));
      line = line.replace(/<!--[\s\S]*?-->/g, (match) => blank(match));
      const unclosedComment = line.indexOf('<!--');
      if (unclosedComment >= 0) {
        line = line.slice(0, unclosedComment) + ' '.repeat(line.length - unclosedComment);
        inComment = true;
      }
      line = line.replace(/<\/?[A-Za-z][^>]*>/g, (match) => blank(match));
      line = line.replace(/!?\[[^\]]*\]\([^)]*\)/g, (match) => {
        const close = match.indexOf(']');
        return match.slice(0, close + 1) + blank(match.slice(close + 1));
      });
      line = line.replace(/\[[^\]]+\]\[[^\]]*\]/g, (match) => {
        const close = match.indexOf(']');
        return match.slice(0, close + 1) + blank(match.slice(close + 1));
      });
      line = line.replace(/(\\+)\{/g, (match, slashes: string) =>
        slashes.length % 2 === 1 ? blank(match) : match,
      );
      return line;
    })
    .join('\n');
}

export interface ScannedHeading {
  heading: string;
  line: number;
  body: string;
}

const HEADING_PATTERN = /^ {0,3}##(?!#)(?:[ \t]+(.*?))?[ \t]*$/;

/**
 * Extract document-top-level ATX `##` headings only: headings inside fenced
 * or indented code, HTML blocks, HTML comments, blockquotes, and list
 * containers are not recognized, and Setext headings never match (§11.1).
 */
export function scanTopLevelSections(markdown: string, lineOffset: number): ScannedHeading[] {
  const lines = markdown.split('\n');
  const starts: Array<{index: number; heading: string}> = [];
  let fence: {marker: string; length: number} | undefined;
  let htmlBlock: {kind: HtmlBlockKind; closer?: RegExp} | undefined;
  let inComment = false;
  let listIndent = 0;

  lines.forEach((line, index) => {
    const commentState: CommentState = {inComment};
    const masked = maskHtmlComments(line, commentState);
    const touchedByComment = inComment || line.includes('<!--');
    inComment = commentState.inComment;
    if (touchedByComment) return;

    if (fence) {
      const closing = new RegExp(`^ {0,3}${fence.marker}{${fence.length},}[ \\t]*$`);
      if (closing.test(line)) fence = undefined;
      return;
    }
    const fenceOpen = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fenceOpen?.[1]) {
      fence = {marker: fenceOpen[1][0]!, length: fenceOpen[1].length};
      return;
    }

    if (htmlBlock) {
      if (htmlBlockEnds(line, htmlBlock.kind, htmlBlock.closer)) htmlBlock = undefined;
      return;
    }
    const blockStart = htmlBlockStart(line);
    if (blockStart) {
      if (!htmlBlockEnds(line, blockStart.kind, blockStart.closer)) htmlBlock = blockStart;
      return;
    }

    const listMarker = /^( *)(?:[-+*]|\d+[.)])[ \t]+/.exec(line);
    if (listMarker) {
      listIndent = listMarker[0].length;
      return;
    }
    if (/^\s*$/.test(line)) {
      listIndent = 0;
      return;
    }
    const leading = /^ +/.exec(line)?.[0].length ?? 0;
    if (/^(?: {4}|\t)/.test(line)) return;
    if (listIndent > 0 && leading >= listIndent) return;

    const match = HEADING_PATTERN.exec(masked);
    if (!match) return;
    const heading = (match[1] ?? '').replace(/[ \t]+#+[ \t]*$/, '').trim();
    starts.push({index, heading});
  });

  return starts.map((start, index) => {
    const next = starts[index + 1];
    return {
      heading: start.heading,
      line: lineOffset + start.index + 1,
      body: lines.slice(start.index + 1, next ? next.index : lines.length).join('\n'),
    };
  });
}
