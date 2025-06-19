import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import { InfraConfig, getResourceName } from '../config';

export interface GitHubActionsConstructProps {
  config: InfraConfig;
  websiteBucket: s3.Bucket;
  distribution: cloudfront.Distribution;
}

export class GitHubActionsConstruct extends Construct {
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: GitHubActionsConstructProps) {
    super(scope, id);

    const { config, websiteBucket, distribution } = props;

    // Create OIDC provider for GitHub Actions
    // const oidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOIDC', {
    //   url: 'https://token.actions.githubusercontent.com',
    //   clientIds: ['sts.amazonaws.com'],
    //   thumbprints: ['6938fd4d98bab03faadb97b34396831e3780aea1'], // GitHub's thumbprint
    // });

    // Or import it if it already exists
    const oidcProviderArn = `arn:aws:iam::${cdk.Stack.of(this).account}:oidc-provider/token.actions.githubusercontent.com`;
    const oidcProvider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      this,
      'ExistingGitHubOIDCProvider',
      oidcProviderArn
    );

    // Create IAM role for GitHub Actions
    this.role = new iam.Role(this, 'GitHubActionsRole', {
      roleName: getResourceName(config, 'github-actions-role'),
      assumedBy: new iam.WebIdentityPrincipal(oidcProvider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': `repo:${config.githubRepo}:*`,
        },
      }),
      description: `Role for GitHub Actions to deploy ${config.projectName}`,
      maxSessionDuration: cdk.Duration.hours(1),
    });

    // Grant permissions to sync files to S3 bucket
    websiteBucket.grantReadWrite(this.role);
    websiteBucket.grantDelete(this.role);

    // Grant permission to create CloudFront invalidations
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudfront:CreateInvalidation'],
        resources: [
          `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${distribution.distributionId}`,
        ],
      })
    );

    // Output the role ARN for GitHub Actions configuration
    new cdk.CfnOutput(this, 'GitHubActionsRoleArn', {
      value: this.role.roleArn,
      description: 'IAM Role ARN for GitHub Actions',
    });

    new cdk.CfnOutput(this, 'GitHubActionsRoleName', {
      value: this.role.roleName,
      description: 'IAM Role Name for GitHub Actions',
    });
  }
}
