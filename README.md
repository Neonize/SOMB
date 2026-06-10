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

## Writing Blog Posts

Create a new post (pass the title directly, or run without arguments for interactive prompts):

```bash
bun run new-post "My Awesome New Post" --desc "Short teaser"
```

This generates `app/blog/YYYY-MM-DD-my-awesome-new-post.md` from the template in
`scripts/post-template.md` with `title`, `date`, `draft: true` and `description`
pre-filled. Edit the template to change the defaults for all future posts.

Preview while writing:

```bash
bun run dev
```

When you're done, publish the draft — this removes `draft: true` and stamps
`publishedDate` automatically:

```bash
bun run publish-post my-awesome-new-post   # or just `bun run publish-post` to pick from a list
```

Commit and push to `main` — GitHub Actions deploys the site automatically.

---
