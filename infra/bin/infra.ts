#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { InfraStack } from '../lib/infra-stack';
import { getConfig } from '../lib/config';

const app = new cdk.App();

// Load configuration to get the region
const config = getConfig();

new InfraStack(app, `${config.projectName}-${config.environment}-stack`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.region, // us-east-1 for CloudFront certificates
  },
  description: `Infrastructure for ${config.projectName} blog and newsletter system`,
});
