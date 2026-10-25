# SOMB — Architecture

## Core Technologies

- **AWS CDK (TypeScript):** Infra as code for S3, CloudFront, Route53, ACM, IAM (planned: DynamoDB + SES)
- **GitHub Actions:** For deploys on branch pushes (planned: newsletter sends)
- **Nue 2 (nuekit):** Static site generator for the blog frontend
- **SES (planned):** For sending newsletters
- **DynamoDB (planned):** To store subscribers
- **Markdown:** Source for all content

## High-Level Flow

1. Write content in Markdown in `app/blog/`
2. Git push triggers a website deploy (GitHub Action); newsletter send on push (planned)
3. Sent post gets updated (`draft: false` gets removed and `publishedDate` gets added)
4. Website gets build and served from S3/CloudFront
5. Subscribers managed via DynamoDB (planned)

## Design Principles

- Everything is **modular** and **decoupled**
- All "account" info stored in env/config — ready for future SaaS/tenantifying
- No data hard-wiring; blog/site/newsletter are all parameterized
