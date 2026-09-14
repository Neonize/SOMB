# SOMB website (Nue 2.x)

This directory is the website root for [Nue 2](https://nuejs.org). Run it from the repo root:

```bash
bun run dev       # dev server on http://localhost:8083 (serves directly from source)
bun run build     # production build to app/.dist/
bun run preview   # preview the production build
```

## Structure

| Path | Purpose |
| --- | --- |
| `site.yaml` | All site configuration: metadata, navigation, blog collection, RSS, sitemap |
| `layout.html` | Global layout components: `header`, `footer` and the `page-list` blog index |
| `blog/layout.html` | `pagehead` component rendered above every blog post (title + date) |
| `blog/*.md` | Blog posts — create them with `bun run new-post` |
| `@shared/design/` | Global CSS, auto-included on every page and inlined in production |
| `contact/contact.html` | Interactive contact form (`<!doctype dhtml lib>`, mounted client-side) |
| `img/` | Static images |

## Conventions

- Navigation links live in `site.yaml` under `navigation:` — edit there, not in HTML.
- The `blog` collection (`site.yaml` → `collections:`) feeds the front page list,
  `feed.xml` and `sitemap.xml`. Posts with `draft: true` are excluded everywhere.
- Page URLs are extensionless (`/blog/my-post`); CloudFront rewrites them to the
  underlying `.html` objects (see `infra/lib/constructs/static-website.ts`).
- Set `site.origin` in `site.yaml` to your real domain — it is used for RSS,
  sitemap and Open Graph URLs.
