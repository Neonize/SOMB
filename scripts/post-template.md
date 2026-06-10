---
title: "{{ title }}"
date: {{ date }}
draft: true
description: "{{ description }}"
---

Write your post here.

## Frontmatter reference

- `title` — shown as the post headline and in the blog list
- `date` — creation date, used for the filename and sorting
- `draft: true` — keeps the post out of the published site; remove it via `bun run publish-post`
- `publishedDate` — added automatically when you publish
- `description` — shown in the blog list and used for SEO/OG tags
