#!/usr/bin/env node
/**
 * Add publishedDate to newly published blog posts.
 *
 * This script detects when a blog post transitions from draft to published
 * and automatically adds the publishedDate field.
 *
 * A post is considered "newly published" if:
 * - It does NOT have `draft: true` in frontmatter
 * - It does NOT have a `publishedDate` field
 * - It has a `date` field
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import { execSync } from 'child_process'

// Get the directory where this script is located
const __dirname = dirname(fileURLToPath(import.meta.url))
const BLOG_DIR = join(__dirname, '..', 'app', 'blog')
const TODAY = new Date().toISOString().split('T')[0]

/**
 * Check if a blog post needs a publishedDate added.
 */
function needsPublishedDate(frontmatter) {
  // Don't add if it's still a draft
  if (frontmatter.draft === true) return false

  // Don't add if it already has a publishedDate
  if (frontmatter.publishedDate) return false

  // Only add if it has a date field
  return !!frontmatter.date
}

/**
 * Add publishedDate to a blog post.
 */
function addPublishedDate(filePath) {
  try {
    const fileContent = readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContent)

    if (needsPublishedDate(data)) {
      // Add publishedDate
      data.publishedDate = TODAY

      // Reconstruct the file with updated frontmatter
      const newContent = matter.stringify(content, data)

      writeFileSync(filePath, newContent, 'utf-8')
      console.log(`✓ Added publishedDate: ${filePath}`)
      return true
    }

    return false
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message)
    return false
  }
}

/**
 * Get blog files changed in the latest commit.
 */
function getChangedBlogFiles() {
  // Try to get files from git diff (for GitHub Actions)
  try {
    // Get the git root directory
    const gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim()

    // Get all changed blog files in the latest commit
    const changedFiles = execSync(
      'git diff --name-only HEAD~1 HEAD',
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
  } catch (error) {
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
