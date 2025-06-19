# SOMB Deployment Guide

This guide provides step-by-step instructions for deploying your SOMB blog infrastructure to AWS.

## Quick Deployment Checklist

- [ ] AWS CLI configured with appropriate permissions
- [ ] Domain name ready (can be subdomain for testing)
- [ ] GitHub repository forked and cloned
- [ ] Environment variables configured
- [ ] CDK bootstrapped
- [ ] Infrastructure deployed
- [ ] DNS configured
- [ ] GitHub Actions secrets configured
- [ ] First deployment tested

## Detailed Steps

### 1. Prerequisites Setup

**AWS Account Setup:**

- Ensure you have an AWS account with administrative permissions
- Install and configure AWS CLI:

```bash
aws configure
```

**Local Environment:**

- Install bun: <https://bun.sh/>
- Clone your forked repository
- Install dependencies: `bun install`

### 2. Infrastructure Configuration

**Navigate to infrastructure directory:**

```bash
cd infra
bun install
```

**Configure environment:**

```bash
cp .env.example .env
```

**Edit `.env` file:**

```bash
DOMAIN_NAME=blog.yourdomain.com    # Your domain/subdomain
PROJECT_NAME=somb                  # Project identifier
GITHUB_REPO=username/repository    # Your GitHub repo
```

### 3. Deploy AWS Infrastructure

**Bootstrap CDK (first time only):**

```bash
bun run cdk bootstrap
```

**Deploy infrastructure:**

```bash
bun run cdk deploy
```

**Expected output:**

- Name servers for DNS configuration
- S3 bucket name
- CloudFront distribution ID
- GitHub Actions role ARN

### 4. Configure DNS

**Copy name servers from CDK output and configure in your domain registrar:**

1. Log into your domain registrar (GoDaddy, Namecheap, etc.)
2. Find DNS settings for your domain
3. Replace existing name servers with the ones from CDK output
4. Save changes

**DNS propagation can take up to 48 hours but usually completes within a few hours.**

### 5. Configure GitHub Actions

**Add secrets to your GitHub repository:**

Go to: Repository Settings → Secrets and variables → Actions

Add these secrets:

- `AWS_ROLE_ARN`: From CDK output
- `S3_BUCKET_NAME`: From CDK output
- `CLOUDFRONT_DISTRIBUTION_ID`: From CDK output
- `DOMAIN_NAME`: Your domain name

### 6. Test Deployment

**Trigger first deployment:**

1. Make a small change to any file in `/app` directory
2. Commit and push to main branch
3. Check GitHub Actions tab for deployment progress
4. Visit your domain once deployment completes

## Verification Steps

### Check Infrastructure

```bash
# Verify S3 bucket exists
aws s3 ls | grep your-bucket-name

# Check CloudFront distribution
aws cloudfront list-distributions

# Verify certificate status
aws acm list-certificates --region us-east-1
```

### Check DNS

```bash
# Check DNS propagation
nslookup your-domain.com

# Check if domain resolves to CloudFront
dig your-domain.com
```

### Check Website

- Visit `https://your-domain.com`
- Verify SSL certificate is valid
- Check that content loads correctly

## Common Issues and Solutions

### Certificate Validation Stuck

**Problem:** Certificate stays in "Pending validation" status
**Solution:**

- Ensure DNS is pointing to Route53 name servers
- Wait for DNS propagation (up to 48 hours)
- Check Route53 hosted zone has validation records

### GitHub Actions Fails

**Problem:** Deployment fails with permission errors
**Solution:**

- Verify all GitHub secrets are correctly set
- Check IAM role trust policy allows your repository
- Ensure role has necessary S3 and CloudFront permissions

### Website Shows 403/404 Errors

**Problem:** Website not accessible or shows errors
**Solution:**

- Check S3 bucket has website files
- Verify CloudFront distribution is deployed
- Check CloudFront error pages configuration
- Ensure index.html exists in S3 bucket

### DNS Not Resolving

**Problem:** Domain doesn't resolve to website
**Solution:**

- Verify name servers are correctly configured
- Wait for DNS propagation
- Check Route53 hosted zone has correct A records
- Use DNS checker tools to verify propagation

## Cost Monitoring

**Expected monthly costs:**

- Route53 hosted zone: ~$0.50
- S3 storage: ~$0.01-$1.00 (depending on content size)
- CloudFront: Free tier covers most small blogs
- Certificate Manager: Free
- **Total: $0.50-$5.00/month**

**Monitor costs:**

- Set up AWS billing alerts
- Check AWS Cost Explorer regularly
- Use AWS Free Tier dashboard

## Security Best Practices

- ✅ S3 bucket is private (no public access)
- ✅ CloudFront uses Origin Access Control
- ✅ GitHub Actions uses OIDC (no long-lived keys)
- ✅ IAM role has minimal required permissions
- ✅ HTTPS enforced for all traffic
- ✅ Modern TLS version required

## Maintenance

**Regular tasks:**

- Monitor AWS costs monthly
- Check certificate expiration (auto-renewed)
- Review GitHub Actions logs for issues
- Update CDK dependencies periodically

**Updates:**

```bash
# Update infrastructure
cd infra
bun run cdk diff    # Check changes
bun run cdk deploy  # Apply updates
```

## Rollback Procedure

**If deployment fails:**

```bash
# Check what changed
bun run cdk diff

# Rollback to previous version
git revert <commit-hash>
bun run cdk deploy
```

**Emergency rollback:**

```bash
# Destroy infrastructure (careful!)
bun run cdk destroy
```

## Support

For issues:

1. Check this guide's troubleshooting section
2. Review AWS CloudFormation events in AWS Console
3. Check GitHub Actions logs
4. Review CDK documentation: <https://docs.aws.amazon.com/cdk/>

## Next Steps

After successful deployment:

- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy
- [ ] Plan for future newsletter functionality
- [ ] Consider multi-environment setup (dev/staging/prod)
