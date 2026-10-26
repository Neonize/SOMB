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
import { getFrontmatter, stampDocument } from "./lib/post-frontmatter";

const ROOT = join(dirname(Bun.main), "..");
const BLOG_DIR = process.env.SOMB_BLOG_DIR ?? join(ROOT, "app", "blog");

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

// Draft detection and stamping live in ./lib/post-frontmatter
// (shared with the CI script); body content is never matched or modified.

const drafts: string[] = [];
for (const name of readdirSync(BLOG_DIR)) {
  if (!name.endsWith(".md")) continue;
  const text = await Bun.file(join(BLOG_DIR, name)).text();
  if (/^draft:\s*true\s*$/m.test(getFrontmatter(text))) drafts.push(name);
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
const text = await Bun.file(path).text();

const stamped = stampDocument(text, today, { overwrite: true });
if (stamped === null) fail(`${file} has no frontmatter block or could not be stamped.`);
await Bun.write(path, stamped);

console.log(`✓ Published ${basename(file)} (publishedDate: ${today})`);
console.log("");
console.log("Commit and push to deploy:");
console.log(`  git add app/blog/${file} && git commit -m "blog: publish ${file}" && git push`);
