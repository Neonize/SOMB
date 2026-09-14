# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SOMB (Snapshot of My Brain) is an open-source newsletter & blog engine with AWS-native infrastructure. Content is written in Markdown, published as a static site via Nue.js, and distributed via AWS SES (newsletter functionality planned). The project is designed for SaaS-readiness while maintaining a solo-tenant MVP.

## Architecture

### Workspaces
- `app/` — Nue.js static site (frontend)
- `infra/` — AWS CDK infrastructure (TypeScript)

### Key Technologies
- **Build System**: Bun (JavaScript runtime and package manager)
- **Frontend**: Nue.js (static site generator)
- **Infrastructure**: AWS CDK with TypeScript
- **Hosting**: S3 + CloudFront (private bucket, CloudFront-only access via OAI)
- **CI/CD**: GitHub Actions with OIDC (no long-lived AWS credentials)

## Development Commands

### Frontend Development
```bash
bun run dev          # Start Nue.js dev server (port 8083)
bun run build        # Build production static site to app/.dist/prod/
bun run new-blog     # Interactive script to create new blog post
```

### Infrastructure
```bash
bun run build:infra  # Build infrastructure TypeScript (runs in infra/ directory)
cd infra && bun run cdk deploy    # Deploy AWS infrastructure
cd infra && bun run cdk destroy   # Destroy AWS infrastructure
cd infra && bun test              # Run infrastructure tests (Jest)
```

## Content Management

### Creating Blog Posts
Use `bun run new-blog` which generates a file in `app/blog/` with:
- Filename format: `YYYY-MM-DD-slugified-title.md`
- Frontmatter: `title`, `date`, `draft: true`, `description` (empty)
- `publishedDate` is added automatically by deployment pipeline when publishing

### Blog Post Frontmatter
```yaml
---
title: "Post Title"
date: YYYY-MM-DD
draft: true
description: ""
publishedDate: YYYY-MM-DD  # Added when post is published
---
```

## Conventional Commits

The project uses Commitlint with custom types for content:

**Standard types**: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`

**Custom content types**:
- `blog` — New or updated blog post content
- `newsletter` — New or updated newsletter edition/content

Examples:
```
blog: add "Why Build in Public?" entry
newsletter: 2024-06-21 summer update
fix: update CloudFront cache behavior
```

## Infrastructure Configuration

### Environment Variables (infra/.env)
Required variables (see `infra/lib/config.ts`):
- `DOMAIN_NAME` — Your domain name
- `PROJECT_NAME` — Project identifier for resource naming
- `GITHUB_REPO` — GitHub repository (e.g., "username/repo")

### Resource Naming Convention
Resources follow the pattern: `{PROJECT_NAME}-{environment}-{resourceType}`
- Example: `somb-prod-websiteBucket`

### AWS Region
Infrastructure is deployed to `us-east-1` (required for CloudFront certificates).

## Deployment

### Automatic Deployment
Pushing to `main` branch triggers GitHub Actions workflow (`.github/workflows/deploy.yml`) if changes are in `app/**`. The workflow:
1. Builds the site with `bun run build --production`
2. Syncs to S3 with cache-control headers
3. Creates CloudFront invalidation for `/*`

### Cache Strategy
- Static assets (images, JS, CSS): `max-age=31536000` (1 year)
- HTML/XML/TXT files: `max-age=0, must-revalidate`

### Security
- Private S3 bucket accessed only via CloudFront OAI
- GitHub Actions uses OIDC role (no AWS access keys)
- SSL certificates via AWS Certificate Manager

## Important Files

### Frontend Configuration
- `app/site.yaml` — Nue.js site config (navigation, metadata, globals)

### Infrastructure
- `infra/lib/config.ts` — Environment configuration and resource naming
- `infra/bin/*` — CDK app entry points
- `infra/lib/*` — CDK constructs and infrastructure code

### Package Management
- Root `package.json` — Workspace configuration, frontend scripts
- `infra/package.json` — Infrastructure-specific dependencies

## Architecture Patterns

### Static Site Generation
Nue.js compiles Markdown to static HTML/CSS/JS. The `app/` directory contains:
- `@global/` — Global CSS styles
- `@library/` — Reusable CSS components
- Content directories (blog/, about/, contact/) as Markdown files
- `site.yaml` — Site configuration

### Infrastructure as Code
AWS CDK constructs define infrastructure in TypeScript. The infrastructure is modular with separate constructs for different resources.

## Roadmap Items

Planned features for SaaS transition:
- DynamoDB for subscriber management
- AWS SES for newsletter delivery
- Lambda functions for dynamic features
- Multi-user support

## License

This project is AGPLv3. If hosting as a public SaaS, modifications must be open-sourced.
