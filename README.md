# SOMB — Snapshot of My Brain

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/vmartens)

A fully open with-infrastructure newsletter & blog engine built for clarity, rapid iteration, and SaaS-readiness. Content lives in Markdown, is published as a Nue SPA static site, and is also sent to subscribers via AWS SES.

- 🚀 Easily forkable, open codebase (one repo)
- ☁️  AWS-native infra (CDK/TypeScript), GitHub Actions/CICD
- ✉️  Write in Markdown; email + blog from the same file
- 🤝 Roadmap includes multi-user/SaaS, but MVP is solo-tenant

**I build this in public and blog about every design choice.**

## License

This project is licensed under the GNU Affero General Public License v3.0.  
See [LICENSE](./LICENSE) for details or [choosealicense.com](https://choosealicense.com/licenses/agpl-3.0/) for more information.

### What does AGPLv3 mean for you?

- ✅ You can use, copy, fork, and adapt this project, for personal or commercial use.
- ✅ If you host the code as a public service (SaaS), you must open source your live version and modifications.
- ❌ You cannot run a closed-source SaaS based on SOMB without making your changes public.

## Quick Start

- See [SETUP_GUIDE.md](./SETUP_GUIDE.md) to fork, build, and deploy your own version.
- See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for tech details.
- See [FUTURE_SAAS.md](./FUTURE_SAAS.md) for plans on SaaS-ification.
- See [infra/README.md](./infra/README.md) for infrastructure documentation.

## Creating New Blog Entries

To create a new blog post, use the built-in script:

```bash
bun run new-blog
```

This will:

1. Prompt you for a blog title
2. Generate a new markdown file in `app/blog/` with the current date
3. Create the filename using the pattern: `YYYY-MM-DD-slugified-title.md`
4. Set up the frontmatter with `title`, `date`, `draft: true`, and empty `description`

**Example:**

```bash
$ bun run new-blog
Blog title: My Awesome New Post
Created: app/blog/2025-06-19-my-awesome-new-post.md
```

The generated file will be ready for you to write content. The `publishedDate` field will be added automatically by the pipeline when you publish the post.

---
