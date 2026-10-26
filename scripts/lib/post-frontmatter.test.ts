import { test, expect } from "bun:test";
import { getFrontmatter, stripDraftLine, setPublishedDate, stampDocument } from "./post-frontmatter";

test("getFrontmatter returns the leading block only", () => {
  const text = "---\ntitle: T\n---\n\nBody\n---\nnot frontmatter\n";
  expect(getFrontmatter(text)).toBe("---\ntitle: T\n---");
  expect(getFrontmatter("Body only\n")).toBe("");
});

test("stripDraftLine removes a draft: true line", () => {
  expect(stripDraftLine("---\ntitle: T\ndraft: true\ndate: 2026-01-01\n---")).toBe(
    "---\ntitle: T\ndate: 2026-01-01\n---",
  );
});

test("body draft: true is untouched by stripDraftLine", () => {
  const fm = "---\ndate: 2026-01-01\n---";
  expect(stripDraftLine(fm)).toBe(fm);
  const doc = "---\ndate: 2026-01-01\n---\n\ndraft: true\n";
  expect(stampDocument(doc, "2026-01-02", { overwrite: true })).not.toContain("\ndraft: true\n---");
});

test("setPublishedDate inserts after the date line", () => {
  expect(setPublishedDate("---\ndate: 2026-01-01\n---", "2026-02-02", { overwrite: false })).toBe(
    "---\ndate: 2026-01-01\npublishedDate: 2026-02-02\n---",
  );
});

test("setPublishedDate replaces an existing value when overwrite is true", () => {
  expect(
    setPublishedDate("---\ndate: 2026-01-01\npublishedDate: 2020-01-01\n---", "2026-02-02", {
      overwrite: true,
    }),
  ).toBe("---\ndate: 2026-01-01\npublishedDate: 2026-02-02\n---");
});

test("setPublishedDate preserves an existing value when overwrite is false", () => {
  expect(
    setPublishedDate("---\ndate: 2026-01-01\npublishedDate: 2020-01-01\n---", "2026-02-02", {
      overwrite: false,
    }),
  ).toBeNull();
});

test("stampDocument returns null without frontmatter", () => {
  expect(stampDocument("No frontmatter here.\n", "2026-02-02", { overwrite: true })).toBeNull();
});

test("stampDocument inserts before the delimiter when no date field exists", () => {
  expect(stampDocument("---\ntitle: T\n---\n\nBody.\n", "2026-02-02", { overwrite: true })).toBe(
    "---\ntitle: T\npublishedDate: 2026-02-02\n---\n\nBody.\n",
  );
});
