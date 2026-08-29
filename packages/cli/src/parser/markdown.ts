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

function maskInlineCodeSpans(value: string): string {
  let result = '';
  let copiedThrough = 0;
  let cursor = 0;
  while (cursor < value.length) {
    if (value[cursor] !== '`') {
      cursor += 1;
      continue;
    }

    const openingLength = runLength(value, cursor, '`');
    let search = cursor + openingLength;
    let closingEnd: number | undefined;
    while (search < value.length) {
      if (value[search] !== '`') {
        search += 1;
        continue;
      }
      const closingLength = runLength(value, search, '`');
      if (closingLength === openingLength) {
        closingEnd = search + closingLength;
        break;
      }
      search += closingLength;
    }

    if (closingEnd === undefined) {
      cursor += openingLength;
      continue;
    }
    result += value.slice(copiedThrough, cursor);
    result += maskPreservingLines(value.slice(cursor, closingEnd));
    copiedThrough = closingEnd;
    cursor = closingEnd;
  }
  return result + value.slice(copiedThrough);
}

export function maskMarkdownReferenceLiterals(markdown: string): string {
  const lines = markdown.split('\n');
  const commentState: CommentState = {inComment: false};
  let fence: {marker: '`' | '~'; length: number} | undefined;
  const visible = lines.map((line) => {
    if (fence) {
      const closingPattern = new RegExp(`^ {0,3}${fence.marker}{${fence.length},}[ \\t]*$`);
      if (closingPattern.test(line)) fence = undefined;
      return ' '.repeat(line.length);
    }

    const withoutComments = maskHtmlComments(line, commentState);
    const opening = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(withoutComments);
    if (opening?.[1]) {
      fence = {
        marker: opening[1][0] as '`' | '~',
        length: opening[1].length,
      };
      return ' '.repeat(line.length);
    }
    return withoutComments;
  });
  return maskInlineCodeSpans(visible.join('\n'));
}
