/**
 * Pure frontmatter utilities shared by publish-post.ts (local) and
 * add-published-date.ts (CI). Surgical, line-based edits — never rewrite
 * or reorder the whole frontmatter block.
 */
export function getFrontmatter(text: string): string {
  return text.match(/^---\r?\n[\s\S]*?\r?\n---/)?.[0] ?? "";
}

export function stripDraftLine(fm: string): string {
  return fm.replace(/^draft:\s*true\s*\n/m, "");
}

/** Insert or replace publishedDate. Returns null when an existing value
 *  must be preserved (opts.overwrite false) — caller treats as "unchanged". */
export function setPublishedDate(fm: string, date: string, opts: { overwrite: boolean }): string | null {
  if (/^publishedDate:/m.test(fm)) {
    if (!opts.overwrite) return null;
    return fm.replace(/^publishedDate:.*$/m, `publishedDate: ${date}`);
  }
  if (/^(date:.*)$/m.test(fm)) {
    return fm.replace(/^(date:.*)$/m, `$1\npublishedDate: ${date}`);
  }
  // No date field: insert before the closing delimiter.
  return fm.replace(/\n---\s*$/, `\npublishedDate: ${date}\n---`);
}

/** Apply strip+stamp to a full document; null when nothing changed. */
export function stampDocument(text: string, date: string, opts: { overwrite: boolean }): string | null {
  const fm = getFrontmatter(text);
  if (!fm) return null;
  const next = setPublishedDate(stripDraftLine(fm), date, opts);
  if (next === null) return null;
  return next + text.slice(fm.length);
}
