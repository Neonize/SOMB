#!/usr/bin/env bun
/**
 * Post-processes app/.dist/sitemap.xml so <lastmod> values come from
 * content frontmatter (publishedDate, then date) instead of file mtime.
 * Entries without a source date get their <lastmod> removed (optional per spec).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SITEMAP = join(ROOT, 'app/.dist/sitemap.xml')
const SITE_YAML = join(ROOT, 'app/site.yaml')

if (!existsSync(SITEMAP)) {
  console.error(`sitemap not found: ${SITEMAP}`)
  process.exit(1)
}

const siteYaml = readFileSync(SITE_YAML, 'utf-8')
const originMatch = siteYaml.match(/^[ \t]+origin:\s*(\S+)/m)
const origin = originMatch?.[1]
if (!origin) {
  console.error('site.origin not found in app/site.yaml')
  process.exit(1)
}

const xml = readFileSync(SITEMAP, 'utf-8')

const blocks = xml.split(/(?=<url>)/)
const urlBlocks = blocks.filter(b => b.startsWith('<url>'))
if (urlBlocks.length === 0) {
  console.error('sitemap contains no <url> blocks')
  process.exit(1)
}

const DATE_RE = /^---\n([\s\S]*?)\n---/

function frontmatterDate(appPath: string): string | null {
  if (!existsSync(appPath)) return null
  const md = readFileSync(appPath, 'utf-8')
  const fm = md.match(DATE_RE)?.[1] ?? ''
  return fm.match(/^publishedDate:\s*(\d{4}-\d{2}-\d{2})/m)?.[1]
    ?? fm.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m)?.[1]
    ?? null
}

let out = ''
for (const block of blocks) {
  if (!block.startsWith('<url>')) {
    out += block
    continue
  }
  const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]
  const path = loc ? loc.replace(origin, '') : ''
  if (!path) {
    out += block
    continue
  }
  const srcRel = path.endsWith('/') ? `${path}index.md` : `${path}.md`
  const date = frontmatterDate(join(ROOT, 'app', srcRel))
  if (block.includes('<lastmod>')) {
    out += date
      ? block.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${date}</lastmod>`)
      : block.replace(/\s*<lastmod>[^<]*<\/lastmod>/, '')
  } else if (date) {
    out += block.replace(/<\/url>/, `<lastmod>${date}</lastmod></url>`)
  } else {
    out += block
  }
}

writeFileSync(SITEMAP, out)
console.log(`sitemap lastmod updated: ${urlBlocks.length} url blocks`)
