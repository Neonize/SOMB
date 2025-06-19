# SOMB Infrastructure Quick Reference

## Environment Variables (.env)

```bash
DOMAIN_NAME=blog.yourdomain.com
PROJECT_NAME=somb
GITHUB_REPO=username/repository-name
```

## Common Commands

```bash
# Install dependencies
bun install

# Build TypeScript
bun run build

# Bootstrap CDK (first time only)
bun run cdk bootstrap

# Deploy infrastructure
bun run cdk deploy

# Show differences before deploy
bun run cdk diff

# Destroy infrastructure (careful!)
bun run cdk destroy

# Watch for changes
bun run watch
```

## GitHub Actions Secrets

Required secrets in your GitHub repository:

- `AWS_ROLE_ARN` - From CDK output
- `S3_BUCKET_NAME` - From CDK output
- `CLOUDFRONT_DISTRIBUTION_ID` - From CDK output
- `DOMAIN_NAME` - Your domain name

## AWS Resources Created

- **S3 Bucket**: `{PROJECT_NAME}-{ENVIRONMENT}-website`
- **CloudFront Distribution**: Custom domain with SSL
- **Route53 Hosted Zone**: DNS management
- **Certificate Manager**: Free SSL certificate
- **IAM Role**: `{PROJECT_NAME}-{ENVIRONMENT}-github-actions-role`

## DNS Configuration

After deployment, configure your domain registrar with the name servers from CDK output.

## Troubleshooting

### Build Issues

```bash
# Check TypeScript errors
bun run build

# Install missing dependencies
bun install
```

### Deployment Issues

```bash
# Check what will change
bun run cdk diff

# View CloudFormation events
aws cloudformation describe-stack-events --stack-name your-stack-name
```

### DNS Issues

```bash
# Check DNS propagation
nslookup your-domain.com
dig your-domain.com
```

## Cost Estimate

- Route53: ~$0.50/month
- S3: ~$0.01-$1.00/month
- CloudFront: Free tier
- Certificate: Free
- **Total: $0.50-$5.00/month**

## Security Features

- ✅ Private S3 bucket
- ✅ CloudFront Origin Access Control
- ✅ OIDC authentication (no AWS keys)
- ✅ Minimal IAM permissions
- ✅ HTTPS enforced
- ✅ Modern TLS only
