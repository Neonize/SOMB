# SOMB Infrastructure

This directory contains the AWS CDK infrastructure code for the SOMB (Snapshot of My Brain) blog and newsletter system.

## Architecture

The infrastructure creates a serverless, cost-optimized setup for hosting a static website with the following components:

- **S3 Bucket**: Stores the static website files
- **CloudFront Distribution**: CDN for global content delivery with custom domain
- **Route53 Hosted Zone**: DNS management for your domain
- **Certificate Manager**: SSL certificate for HTTPS
- **IAM Role + OIDC**: Secure GitHub Actions authentication (no long-lived AWS keys)

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with your credentials
3. **Node.js** and **bun** installed
4. **Domain name** that you want to use for your blog

## Setup Instructions

### 1. Install Dependencies

```bash
cd infra
bun install
```

### 2. Configure Environment

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Your domain name (can be a subdomain for testing)
DOMAIN_NAME=blog.yourdomain.com

# Project name (used for resource naming)
PROJECT_NAME=somb

# Your GitHub repository (format: username/repository-name)
GITHUB_REPO=yourusername/somb
```

### 3. Bootstrap CDK (One-time setup)

If this is your first time using CDK in your AWS account/region:

```bash
bun run cdk bootstrap
```

### 4. Deploy Infrastructure

```bash
bun run cdk deploy
```

This will create all the AWS resources. The deployment will output important values including:

- **Name Servers**: Configure these in your domain registrar
- **S3 Bucket Name**: For GitHub Actions configuration
- **CloudFront Distribution ID**: For GitHub Actions configuration
- **GitHub Actions Role ARN**: For GitHub Actions configuration

### 5. Configure DNS

After deployment, you'll need to configure your domain's DNS:

1. Copy the **Name Servers** from the CDK output
2. Go to your domain registrar (where you bought the domain)
3. Update the DNS settings to use the provided name servers

**Note**: DNS propagation can take up to 48 hours, but usually completes within a few hours.

### 6. Configure GitHub Actions

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `AWS_ROLE_ARN`: The GitHub Actions Role ARN from CDK output
- `S3_BUCKET_NAME`: The S3 bucket name from CDK output
- `CLOUDFRONT_DISTRIBUTION_ID`: The CloudFront distribution ID from CDK output
- `DOMAIN_NAME`: Your domain name (same as in .env)

### 7. Test Deployment

Push changes to the `/app` folder in your repository to trigger the GitHub Actions workflow.

## Commands

```bash
# Install dependencies
bun install

# Build TypeScript
bun run build

# Watch for changes
bun run watch

# Deploy infrastructure
bun run cdk deploy

# Show differences
bun run cdk diff

# Destroy infrastructure (careful!)
bun run cdk destroy
```

## Cost Optimization

This infrastructure is designed to be cost-effective:

- **S3**: Pay only for storage and requests
- **CloudFront**: Free tier covers most small blogs
- **Route53**: ~$0.50/month per hosted zone + query charges
- **Certificate Manager**: Free SSL certificates
- **IAM**: No charges for roles and policies

Expected monthly cost for a small blog: **$0.50 - $5.00**

## Security Features

- **No Public S3 Access**: Bucket is private, accessed only via CloudFront
- **OIDC Authentication**: GitHub Actions uses temporary credentials, no long-lived AWS keys
- **Minimal IAM Permissions**: GitHub Actions role has only necessary permissions
- **HTTPS Only**: All traffic redirected to HTTPS
- **Modern TLS**: Minimum TLS 1.2

## Troubleshooting

### Certificate Validation Issues

If certificate validation fails:

1. Ensure your domain's DNS is pointing to the Route53 name servers
2. Wait for DNS propagation (can take up to 48 hours)
3. Check the certificate status in AWS Certificate Manager console

### GitHub Actions Deployment Fails

1. Verify all GitHub secrets are correctly set
2. Check that the IAM role trust policy allows your repository
3. Ensure the S3 bucket name and CloudFront distribution ID are correct

### Website Not Loading

1. Check that DNS is properly configured
2. Verify CloudFront distribution is deployed
3. Check S3 bucket has the website files
4. Look at CloudFront logs for errors

## Modifying Infrastructure

The infrastructure is modular and organized into constructs:

- `constructs/domain.ts`: Route53 and Certificate Manager
- `constructs/static-website.ts`: S3 and CloudFront
- `constructs/github-actions.ts`: IAM roles for deployment

To modify resources, edit the appropriate construct and run `bun run cdk deploy`.

## Future Enhancements

This infrastructure is designed to be SaaS-ready. Future additions may include:

- DynamoDB for subscriber management
- SES for newsletter functionality
- Lambda functions for dynamic features
- Multi-environment support (dev/staging/prod)
