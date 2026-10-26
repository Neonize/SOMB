import { test, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dir: string;
const run = (args: string[]) =>
  Bun.spawnSync(["bun", join(import.meta.dir, "publish-post.ts"), ...args], {
    env: { ...process.env, SOMB_BLOG_DIR: dir },
  });

const draft = (name: string, extraFrontmatter: string[] = []) =>
  [
    "---",
    `title: "T"`,
    `date: ${name.slice(0, 10)}`,
    ...extraFrontmatter,
    'description: "d"',
    "---",
    "",
    "Body.",
    "",
  ].join("\n");

const writeDraft = (name: string, extraFrontmatter: string[] = ["draft: true"]) =>
  writeFileSync(join(dir, name), draft(name, extraFrontmatter));

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "somb-test-"));
});
beforeEach(() => {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeDraft("2026-01-01-my-draft.md");
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

test("publishes a draft by slug", () => {
  const result = run(["my-draft"]);
  expect(result.exitCode).toBe(0);

  const text = readFileSync(join(dir, "2026-01-01-my-draft.md"), "utf-8");
  expect(text).not.toMatch(/^draft:/m);

  const today = new Date().toISOString().slice(0, 10);
  const lines = text.split("\n");
  const dateIdx = lines.findIndex((l) => l.startsWith("date:"));
  expect(lines[dateIdx + 1]).toBe(`publishedDate: ${today}`);
});

test("unknown slug fails", () => {
  const result = run(["nope"]);
  expect(result.exitCode).not.toBe(0);
  expect(result.stderr.toString()).toMatch(/No draft matches/);
});

test("ambiguous slug fails", () => {
  writeDraft("2026-01-02-my-draft-2.md");
  const result = run(["my-draft"]);
  expect(result.exitCode).not.toBe(0);
  expect(result.stderr.toString()).toMatch(/ambiguous/i);
});

test("body text is never treated as frontmatter", () => {
  const path = join(dir, "2026-01-03-published.md");
  const content = [
    "---",
    'title: "Published"',
    "date: 2026-01-03",
    'description: "d"',
    "---",
    "",
    "draft: true",
    "",
  ].join("\n");
  writeFileSync(path, content);

  const result = run(["published"]);
  expect(result.exitCode).not.toBe(0);
  expect(result.stderr.toString()).toMatch(/No draft matches/);
  expect(readFileSync(path, "utf-8")).toBe(content);
});
