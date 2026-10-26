import { test, expect, afterEach } from "bun:test";
import { execSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Git exports GIT_DIR/GIT_WORK_TREE/etc. to hooks (e.g. husky's `bun test`
// pre-commit); those vars would hijack every git call below into the host
// repo, so strip them from every child environment.
const cleanEnv = () =>
  Object.fromEntries(
    Object.entries(process.env).filter(([k]) => !k.startsWith("GIT_")),
  );

const git = (cmd: string, cwd: string) =>
  execSync(`git ${cmd}`, {
    cwd,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
    env: cleanEnv(),
  });

const repos: string[] = [];
afterEach(() => {
  repos.forEach((r) => rmSync(r, { recursive: true, force: true }));
  repos.length = 0;
});

function makeRepo() {
  // realpath: macOS tmpdir is a symlink (/var -> /private/var); the script
  // mixes git-root paths with ours, and unresolved symlinks break relative().
  const repo = realpathSync(mkdtempSync(join(tmpdir(), "somb-git-")));
  git("init -q", repo);
  git("config user.email test@example.com", repo);
  git("config user.name Tester", repo);
  git('commit -q --allow-empty -m "init"', repo);
  mkdirSync(join(repo, "app", "blog"), { recursive: true });
  return repo;
}

const commitFile = (repo: string, name: string, content: string, msg: string) => {
  writeFileSync(join(repo, "app", "blog", name), content);
  git("add .", repo);
  git(`commit -q -m "${msg}"`, repo);
};

const runScript = (repo: string) =>
  Bun.spawnSync(["node", join(import.meta.dir, "add-published-date.js")], {
    cwd: repo,
    env: { ...cleanEnv(), SOMB_BLOG_DIR: join(repo, "app", "blog") },
  });

const today = new Date().toISOString().slice(0, 10);

test("draft-to-published transition stamps publishedDate", () => {
  const repo = makeRepo();
  commitFile(repo, "2026-01-01-post.md", "---\ntitle: T\ndate: 2026-01-01\ndraft: true\n---\n\nBody.\n", "draft");
  commitFile(repo, "2026-01-01-post.md", "---\ntitle: T\ndate: 2026-01-01\n---\n\nBody.\n", "publish");

  const result = runScript(repo);
  expect(result.exitCode).toBe(0);
  const text = readFileSync(join(repo, "app", "blog", "2026-01-01-post.md"), "utf-8");
  // gray-matter re-serializes dates; today's string comes out single-quoted.
  expect(text).toMatch(new RegExp(`publishedDate: '?${today}'?`));
});

test("existing publishedDate is never overwritten", () => {
  const repo = makeRepo();
  const content = "---\ntitle: T\ndate: 2026-01-01\npublishedDate: 2020-01-01\n---\n\nBody.\n";
  commitFile(repo, "2026-01-02-post.md", content, "add");

  const before = readFileSync(join(repo, "app", "blog", "2026-01-02-post.md"));
  const result = runScript(repo);
  expect(result.exitCode).toBe(0);
  const after = readFileSync(join(repo, "app", "blog", "2026-01-02-post.md"));
  expect(Buffer.compare(before, after)).toBe(0);
});

test("new public post with no draft phase gets stamped", () => {
  const repo = makeRepo();
  commitFile(repo, "2026-01-03-post.md", "---\ntitle: T\ndate: 2026-01-03\n---\n\nBody.\n", "add");

  const result = runScript(repo);
  expect(result.exitCode).toBe(0);
  const text = readFileSync(join(repo, "app", "blog", "2026-01-03-post.md"), "utf-8");
  expect(text).toMatch(new RegExp(`publishedDate: '?${today}'?`));
});

test("body draft: true does not block or trigger stamping", () => {
  const repo = makeRepo();
  commitFile(repo, "2026-01-04-post.md", "---\ntitle: T\ndate: 2026-01-04\ndraft: true\n---\n\nBody.\n", "draft");
  commitFile(repo, "2026-01-04-post.md", "---\ntitle: T\ndate: 2026-01-04\n---\n\nSome docs say draft: true here.\n", "publish");

  const result = runScript(repo);
  expect(result.exitCode).toBe(0);
  const text = readFileSync(join(repo, "app", "blog", "2026-01-04-post.md"), "utf-8");
  expect(text).toMatch(new RegExp(`publishedDate: '?${today}'?`));
  expect(text).toContain("Some docs say draft: true here.");
});
