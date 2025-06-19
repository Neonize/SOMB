import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { getConfig, InfraConfig } from './config';
import { DomainConstruct } from './constructs/domain';
import { StaticWebsiteConstruct } from './constructs/static-website';
import { GitHubActionsConstruct } from './constructs/github-actions';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Load configuration
    const config: InfraConfig = getConfig();

    // Create domain and certificate
    const domain = new DomainConstruct(this, 'Domain', {
      config,
    });

    // Create static website infrastructure
    const website = new StaticWebsiteConstruct(this, 'Website', {
      config,
      hostedZone: domain.hostedZone,
      certificate: domain.certificate,
    });

    // Create GitHub Actions role and permissions
    const githubActions = new GitHubActionsConstruct(this, 'GitHubActions', {
      config,
      websiteBucket: website.bucket,
      distribution: website.distribution,
    });

    // Add tags to all resources
    cdk.Tags.of(this).add('Project', config.projectName);
    cdk.Tags.of(this).add('Environment', config.environment);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
