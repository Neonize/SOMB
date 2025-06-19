import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

export interface InfraConfig {
  domainName: string;
  projectName: string;
  githubRepo: string;
  region: string;
  environment: string;
}

export function getConfig(): InfraConfig {
  const domainName = process.env.DOMAIN_NAME;
  const projectName = process.env.PROJECT_NAME;
  const githubRepo = process.env.GITHUB_REPO;

  if (!domainName || !projectName || !githubRepo) {
    throw new Error(
      'Missing required environment variables. Please check your .env file and ensure DOMAIN_NAME, PROJECT_NAME, and GITHUB_REPO are set.'
    );
  }

  return {
    domainName,
    projectName,
    githubRepo,
    region: 'us-east-1', // Required for CloudFront certificates
    environment: 'prod',
  };
}

export function getResourceName(config: InfraConfig, resourceType: string): string {
  return `${config.projectName}-${config.environment}-${resourceType}`;
}
