import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import { InfraConfig } from '../config';

export interface DomainConstructProps {
  config: InfraConfig;
}

export class DomainConstruct extends Construct {
  public readonly hostedZone: route53.IHostedZone;
  public readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props: DomainConstructProps) {
    super(scope, id);

    const { config } = props;

    // Create hosted zone for the domain
    this.hostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: config.domainName,
      comment: `Hosted zone for ${config.projectName} blog`,
    });

    // Create SSL certificate with DNS validation
    this.certificate = new acm.Certificate(this, 'Certificate', {
      domainName: config.domainName,
      validation: acm.CertificateValidation.fromDns(this.hostedZone),
      subjectAlternativeNames: [`www.${config.domainName}`],
    });

    // Output the name servers for manual DNS configuration
    new cdk.CfnOutput(this, 'NameServers', {
      value: cdk.Fn.join(', ', this.hostedZone.hostedZoneNameServers || []),
      description: 'Name servers for the hosted zone - configure these in your domain registrar',
    });

    // Output the hosted zone ID
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Hosted Zone ID',
    });

    // Output the certificate ARN
    new cdk.CfnOutput(this, 'CertificateArn', {
      value: this.certificate.certificateArn,
      description: 'SSL Certificate ARN',
    });
  }
}
