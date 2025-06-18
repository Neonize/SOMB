# SOMB — Setup Guide

This guide will get you a live blog + newsletter system on AWS, with minimal effort.

## Prerequisites

- AWS account (with verified sender/domain for SES)
- [bun](https://bun.sh/)

---

## 1. Fork and Clone

Fork this repo, clone it locally:

```shell
git clone https://github.com/Neonize/somb.git
cd somb
```

## 2. AWS Infrastructure: CDK

You need the AWS CDK installed globally:

```shell
bun install -g aws-cdk
```

Deploy with:

```shell
cd infra
bun install
cdk bootstrap    # Once per AWS account/region. As we use Cloudfront you need to deploy the Cloudfront stack to us-east-1!
cdk deploy
```

This will create:

  DynamoDB table for subscribers
  S3 bucket for static blog content
  IAM roles for newsletter/email scripts

## 3. Configure AWS & SES

  Verify your sending email/domain in SES (AWS SES email setup guide).
  Move .env.example to .env and fill out your values.

## 4. Setup GitHub Actions

  Add AWS credentials and required secrets to your GitHub repo in Settings > Secrets and variables:
      AWS_ACCESS_KEY_ID
      AWS_SECRET_ACCESS_KEY
      Other SES-related env vars as needed

## 5. Write & Publish

  Add your first markdown file to entries/drafts/
  Move it to entries/newsletter/ to prepare to send! (Dont forget to commit)
  The newsletter send action will email your subs, then move entry to entries/blog/ for the website.

---
