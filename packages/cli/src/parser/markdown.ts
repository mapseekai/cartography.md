export interface CommentState {
  inComment: boolean;
}

export function maskHtmlComments(line: string, state: CommentState): string {
  let cursor = 0;
  let visible = '';
  while (cursor < line.length) {
    if (state.inComment) {
      const end = line.indexOf('-->', cursor);
      if (end < 0) return visible + ' '.repeat(line.length - cursor);
      visible += ' '.repeat(end + 3 - cursor);
      cursor = end + 3;
      state.inComment = false;
      continue;
    }

    const start = line.indexOf('<!--', cursor);
    if (start < 0) return visible + line.slice(cursor);
    visible += line.slice(cursor, start);
    const end = line.indexOf('-->', start + 4);
    if (end < 0) {
      visible += ' '.repeat(line.length - start);
      state.inComment = true;
      return visible;
    }
    visible += ' '.repeat(end + 3 - start);
    cursor = end + 3;
  }
  return visible;
}

function runLength(value: string, start: number, marker: string): number {
  let end = start;
  while (value[end] === marker) end += 1;
  return end - start;
}

function maskPreservingLines(value: string): string {
  return value.replace(/[^\n]/g, ' ');
}

function closingBacktickEnd(
  value: string,
  start: number,
  delimiterLength: number,
): number | undefined {
  let search = start;
  while (search < value.length) {
    if (value[search] !== '`') {
      search += 1;
      continue;
    }
    const closingLength = runLength(value, search, '`');
    if (closingLength === delimiterLength) return search + closingLength;
    search += closingLength;
  }
  return undefined;
}

function endOfLine(value: string, start: number): number {
  const newline = value.indexOf('\n', start);
  return newline < 0 ? value.length : newline;
}

export function maskMarkdownReferenceLiterals(markdown: string): string {
  let visible = '';
  let cursor = 0;
  let atLineStart = true;
  let inComment = false;
  let fence: {marker: '`' | '~'; length: number} | undefined;

  while (cursor < markdown.length) {
    if (fence) {
      const lineEnd = endOfLine(markdown, cursor);
      const line = markdown.slice(cursor, lineEnd);
      const closingPattern = new RegExp(`^ {0,3}${fence.marker}{${fence.length},}[ \\t]*$`);
      if (closingPattern.test(line)) fence = undefined;
      visible += ' '.repeat(line.length);
      if (lineEnd < markdown.length) {
        visible += '\n';
        cursor = lineEnd + 1;
        atLineStart = true;
      } else {
        cursor = lineEnd;
      }
      continue;
    }

    if (!inComment && atLineStart) {
      const lineEnd = endOfLine(markdown, cursor);
      const line = markdown.slice(cursor, lineEnd);
      const opening = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
      if (opening?.[1]) {
        fence = {
          marker: opening[1][0] as '`' | '~',
          length: opening[1].length,
        };
        visible += ' '.repeat(line.length);
        if (lineEnd < markdown.length) {
          visible += '\n';
          cursor = lineEnd + 1;
          atLineStart = true;
        } else {
          cursor = lineEnd;
        }
        continue;
      }
      atLineStart = false;
    }

    if (inComment) {
      if (markdown.startsWith('-->', cursor)) {
        visible += '   ';
        cursor += 3;
        inComment = false;
        atLineStart = false;
        continue;
      }
      if (markdown[cursor] === '\n') {
        visible += '\n';
        cursor += 1;
        atLineStart = true;
      } else {
        visible += ' ';
        cursor += 1;
        atLineStart = false;
      }
      continue;
    }

    if (markdown[cursor] === '`') {
      const openingLength = runLength(markdown, cursor, '`');
      const closingEnd = closingBacktickEnd(
        markdown,
        cursor + openingLength,
        openingLength,
      );
      if (closingEnd !== undefined) {
        visible += maskPreservingLines(markdown.slice(cursor, closingEnd));
        cursor = closingEnd;
        atLineStart = false;
        continue;
      }
    }

    if (markdown.startsWith('<!--', cursor)) {
      visible += '    ';
      cursor += 4;
      inComment = true;
      atLineStart = false;
      continue;
    }

    const character = markdown[cursor]!;
    visible += character;
    cursor += 1;
    atLineStart = character === '\n';
  }

  return visible;
}
