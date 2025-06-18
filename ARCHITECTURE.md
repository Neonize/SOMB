# SOMB — Architecture

## Core Technologies

- **AWS CDK (TypeScript):** Infra as code for DynamoDB, S3, Cloudfront, IAM, SES setup
- **GitHub Actions:** For deploys and newsletter sends on branch pushes
- **Nue SPA:** Blog frontend
- **SES:** For sending newsletters
- **DynamoDB:** To store subscribers
- **Markdown:** Source for all content

## High-Level Flow

1. Write content in Markdown in `entries/`
2. Git push to `newsletter` triggers send to subscribers (GitHub Action)
3. Sent post moves to `blog` branch for static site publishing (GitHub Action)
4. Website served from S3/CloudFront
5. Subscribers managed via DynamoDB

## Design Principles

- Everything is **modular** and **decoupled**
- All "account" info stored in env/config — ready for future SaaS/tenantifying
- No data hard-wiring; blog/site/newsletter are all parameterized

---
