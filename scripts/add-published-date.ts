#!/usr/bin/env bun
/**
 * Add publishedDate to newly published blog posts.
 *
 * This script detects when a blog post transitions from draft to published
 * and automatically adds the publishedDate field.
 *
 * A post is considered newly published if:
 * - It is a newly added public post, or its parent revision has `draft: true`
 * - It does NOT have a `publishedDate` field
 * - It has a `date` field
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { execSync, execFileSync } from 'node:child_process'
import { stampDocument } from './lib/post-frontmatter'

// Get the directory where this script is located
const __dirname = dirname(fileURLToPath(import.meta.url))
const BLOG_DIR = process.env.SOMB_BLOG_DIR || join(__dirname, '..', 'app', 'blog')
const TODAY = new Date().toISOString().split('T')[0]

// Diff base: the SHA the push started from (github.event.before), falling
// back to HEAD~1 when absent/invalid (single-commit push, workflow_dispatch).
const before = process.env.SOMB_BASE_SHA ?? ''
const isSha = /^[0-9a-f]{40}$/.test(before) && !/^0+$/.test(before)
const base = isSha ? before : 'HEAD~1'

/**
 * Get the frontmatter from the parent revision of a blog post.
 */
function getParentFrontmatter(filePath: string) {
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim()
    const relativePath = relative(gitRoot, filePath)
    const parentContent = execFileSync(
      'git',
      ['show', `${base}:${relativePath}`],
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    )

    return matter(parentContent).data
  } catch {
    return null
  }
}

/**
 * Check whether a blog post was added in the current push.
 */
function isNewFile(filePath: string) {
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim()
    const relativePath = relative(gitRoot, filePath)
    const addedFiles = execFileSync(
      'git',
      ['diff', '--name-only', '--diff-filter=A', base, 'HEAD', '--', relativePath],
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    )

    return addedFiles.trim() === relativePath
  } catch {
    return false
  }
}

/**
 * Check if a blog post needs a publishedDate added.
 */
function needsPublishedDate(
  frontmatter: Record<string, unknown>,
  parentFrontmatter: Record<string, unknown> | null,
  newFile: boolean,
) {
  // Don't add if it's still a draft
  if (frontmatter.draft === true) return false

  // Don't add if it already has a publishedDate
  if (frontmatter.publishedDate) return false

  // Only add if it has a date field
  if (!frontmatter.date) return false

  // Newly added public posts have no parent revision to inspect.
  if (newFile) return true

  // Existing posts need a draft-to-public transition.
  return parentFrontmatter?.draft === true
}


/**
 * Add publishedDate to a blog post.
 */
function addPublishedDate(filePath: string) {
  try {
    const fileContent = readFileSync(filePath, 'utf-8')
    const { data } = matter(fileContent)

    const parentFrontmatter = getParentFrontmatter(filePath)
    const newFile = isNewFile(filePath)

    if (needsPublishedDate(data, parentFrontmatter, newFile)) {
      // Surgical stamp: inserts publishedDate, never rewrites the block.
      const stamped = stampDocument(fileContent, TODAY, { overwrite: false })
      if (stamped !== null) {
        writeFileSync(filePath, stamped, 'utf-8')
        console.log(`✓ Added publishedDate: ${filePath}`)
        return true
      }
      return false
    }

    return false
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, (error as Error).message)
    return false
  }
}

/**
 * Get blog files changed in the push.
 */
function getChangedBlogFiles() {
  // Try to get files from git diff (for GitHub Actions)
  try {
    // Get the git root directory
    const gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim()

    // Get all changed blog files since the push's base commit
    const changedFiles = execSync(
      `git diff --name-only ${base} HEAD`,
      { encoding: 'utf-8' }
    )
      .trim()
      .split('\n')
      .filter(Boolean)
      .filter(f => f.startsWith('app/blog/'))
      .map(f => join(gitRoot, f))

    if (changedFiles.length > 0) {
      console.log(`Found ${changedFiles.length} changed blog file(s) in commit`)
      return changedFiles
    }

    // Fallback: check all blog files if no git history available
    console.log('No git changes detected, checking all blog files...')
  } catch {
    console.log('Git detection failed, checking all blog files...')
  }

  // Fallback: return all blog files
  const allBlogFiles = readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => join(BLOG_DIR, f))

  return allBlogFiles
}

/**
 * Main function.
 */
function main() {
  console.log('📅 Checking for newly published blog posts...\n')

  const blogFiles = getChangedBlogFiles()

  if (blogFiles.length === 0) {
    console.log('No blog files found.')
    return
  }

  let updatedCount = 0

  for (const file of blogFiles) {
    if (addPublishedDate(file)) {
      updatedCount++
    }
  }

  console.log(`\n✅ Done: ${updatedCount} post(s) updated`)
}


main()
