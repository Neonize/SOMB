#!/usr/bin/env bun
/**
 * Publish a draft post: removes `draft: true` and stamps `publishedDate`.
 *
 * Usage:
 *   bun run publish-post              # lists drafts, pick one interactively
 *   bun run publish-post <slug>       # publish the draft matching the slug
 */
import { readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";

const ROOT = join(dirname(Bun.main), "..");
const BLOG_DIR = join(ROOT, "app", "blog");

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const drafts: string[] = [];
for (const name of readdirSync(BLOG_DIR)) {
  if (!name.endsWith(".md")) continue;
  const text = await Bun.file(join(BLOG_DIR, name)).text();
  if (/^draft:\s*true\s*$/m.test(text)) drafts.push(name);
}

if (drafts.length === 0) fail("No drafts found in app/blog/.");

// --- pick the draft ----------------------------------------------------
const query = (process.argv[2] ?? "").trim();
let file: string;

if (query) {
  const matches = drafts.filter((name) => name.includes(query));
  if (matches.length === 0) fail(`No draft matches "${query}". Drafts:\n  ${drafts.join("\n  ")}`);
  if (matches.length > 1) fail(`"${query}" is ambiguous:\n  ${matches.join("\n  ")}`);
  file = matches[0];
} else {
  console.log("Drafts:");
  drafts.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));
  const answer = (prompt("Publish which draft? (number):") ?? "").trim();
  const index = Number.parseInt(answer, 10) - 1;
  if (Number.isNaN(index) || index < 0 || index >= drafts.length) fail("Invalid selection.");
  file = drafts[index];
}

// --- update frontmatter ------------------------------------------------
const path = join(BLOG_DIR, file);
const today = new Date().toISOString().slice(0, 10);
let text = await Bun.file(path).text();

text = text.replace(/^draft:\s*true\s*\n/m, "");
if (/^publishedDate:/m.test(text)) {
  text = text.replace(/^publishedDate:.*$/m, `publishedDate: ${today}`);
} else {
  text = text.replace(/^(date:.*)$/m, `$1\npublishedDate: ${today}`);
}

await Bun.write(path, text);

console.log(`✓ Published ${basename(file)} (publishedDate: ${today})`);
console.log("");
console.log("Commit and push to deploy:");
console.log(`  git add app/blog/${file} && git commit -m "blog: publish ${file}" && git push`);
