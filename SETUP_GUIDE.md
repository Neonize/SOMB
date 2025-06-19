# SOMB — Setup Guide

This guide will get you a live blog system on AWS with automated deployment, ready for future newsletter functionality.

## Prerequisites

- AWS account with appropriate permissions
- [bun](https://bun.sh/) installed
- Domain name (can be a subdomain for testing)
- GitHub account

---

## 1. Fork and Clone

Fork this repo, clone it locally:

```shell
git clone https://github.com/yourusername/somb.git
cd somb
```

## 2. Install Dependencies

Install all project dependencies:

```shell
bun install
```

## 3. AWS Infrastructure Setup

### Configure Infrastructure

1. Navigate to the infrastructure directory:

```shell
cd infra
```

2. Install infrastructure dependencies:

```shell
bun install
```

3. Copy and configure environment variables:

```shell
cp .env.example .env
```

4. Edit `.env` with your configuration:

```shell
# Your domain name (can be a subdomain for testing)
DOMAIN_NAME=blog.yourdomain.com

# Project name (used for resource naming)
PROJECT_NAME=somb

# Your GitHub repository (format: username/repository-name)
GITHUB_REPO=yourusername/somb
```

### Deploy Infrastructure

1. Bootstrap CDK (one-time setup per AWS account/region):

```shell
bun run cdk bootstrap
```

2. Deploy the infrastructure:

```shell
bun run cdk deploy
```

This creates:

- S3 bucket for static website hosting
- CloudFront distribution with custom domain
- Route53 hosted zone for DNS
- SSL certificate via Certificate Manager
- IAM role for secure GitHub Actions deployment

3. **Important**: After deployment, configure your domain's DNS with the provided name servers from the CDK output.

## 4. Configure GitHub Actions

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `AWS_ROLE_ARN`: From CDK output
- `S3_BUCKET_NAME`: From CDK output  
- `CLOUDFRONT_DISTRIBUTION_ID`: From CDK output
- `DOMAIN_NAME`: Your domain name

## 5. Test Your Setup

1. Make a change to any file in the `/app` directory
2. Commit and push to the main branch
3. GitHub Actions will automatically build and deploy your site
4. Visit your domain to see the live website

## 6. Create Content

Create new blog posts using the built-in script:

```bash
bun run new-blog
```

This will:

1. Prompt you for a blog title
2. Generate a new markdown file in `app/blog/` with the current date
3. Create the filename using the pattern: `YYYY-MM-DD-slugified-title.md`
4. Set up the frontmatter with `title`, `date`, `draft: true`, and empty `description`

## 7. Publishing Content

1. Write your content in the generated markdown file
2. When ready to publish, remove `draft: true` from the frontmatter
3. Commit and push your changes
4. GitHub Actions will automatically deploy the updated site

---

## Troubleshooting

### DNS Issues

- DNS propagation can take up to 48 hours
- Verify name servers are correctly configured in your domain registrar

### Deployment Issues

- Check GitHub Actions logs for detailed error messages
- Ensure all GitHub secrets are correctly configured
- Verify AWS permissions and CDK deployment completed successfully

### Certificate Issues

- SSL certificates require DNS validation
- Ensure your domain's DNS is pointing to Route53 name servers
- Certificate validation can take several minutes

For detailed infrastructure information, see [infra/README.md](./infra/README.md).

---
