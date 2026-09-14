#!/usr/bin/env bun
/**
 * Create a new blog post from scripts/post-template.md.
 *
 * Usage:
 *   bun run new-post                          # interactive
 *   bun run new-post "My Post Title"
 *   bun run new-post "My Post Title" --desc "Short teaser" --date 2026-06-10
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = join(dirname(Bun.main), "..");
const BLOG_DIR = join(ROOT, "app", "blog");
const TEMPLATE = join(ROOT, "scripts", "post-template.md");

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// safe inside double-quoted YAML values: no line breaks, quotes escaped
function yamlSafe(text: string): string {
  return text.replace(/\s*[\r\n]+\s*/g, " ").replace(/"/g, '\\"');
}

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

// --- parse arguments ---------------------------------------------------
const args = process.argv.slice(2);
const titleParts: string[] = [];
let description = "";
let date = new Date().toISOString().slice(0, 10);

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--desc" || arg === "-d") description = args[++i] ?? "";
  else if (arg === "--date") date = args[++i] ?? date;
  else if (arg === "--help" || arg === "-h") {
    console.log('Usage: bun run new-post "Title" [--desc "Teaser"] [--date YYYY-MM-DD]');
    process.exit(0);
  } else titleParts.push(arg);
}

let title = titleParts.join(" ").trim();
if (!title) {
  title = (prompt("Post title:") ?? "").trim();
  if (!title) fail("A title is required.");
  description = (prompt("Description (optional):") ?? "").trim();
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`Invalid date "${date}" — expected YYYY-MM-DD.`);

// --- create the post ---------------------------------------------------
const slug = slugify(title);
if (!slug) fail(`Could not derive a slug from "${title}".`);

const file = join(BLOG_DIR, `${date}-${slug}.md`);
if (existsSync(file)) fail(`${file} already exists.`);

const template = await Bun.file(TEMPLATE).text();
const content = template
  .replace("{{ title }}", yamlSafe(title))
  .replace("{{ date }}", date)
  .replace("{{ description }}", yamlSafe(description));

await Bun.write(file, content);

console.log(`✓ Created app/blog/${date}-${slug}.md`);
console.log("");
console.log("Next steps:");
console.log("  1. Write your post (preview with: bun run dev)");
console.log("  2. Publish it with:  bun run publish-post " + slug);
