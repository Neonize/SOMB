import { test, expect } from "bun:test";

process.env.DOMAIN_NAME = "example.com";
process.env.PROJECT_NAME = "sombtest";
process.env.GITHUB_REPO = "testowner/testrepo";

// Dynamic imports: config reads process.env at module load, so the env vars
// above must be set before the stack modules evaluate (static imports hoist).
const { InfraStack } = await import("../lib/infra-stack");
const cdk = await import("aws-cdk-lib");
const { Template } = await import("aws-cdk-lib/assertions");

type ErrorResponse = { ErrorCode: number; ResponsePagePath: string; ResponseCode: number };
type Resource = { Type: string; Properties: Record<string, unknown>; DeletionPolicy?: string; UpdateReplacePolicy?: string };
const resourcesOf = (templateInstance: { toJSON(): { Resources: Record<string, unknown> } }, type: string) =>
  Object.values(templateInstance.toJSON().Resources)
    .filter((r): r is Resource => (r as Resource).Type === type);

const app = new cdk.App();
const stack = new InfraStack(app, "TestStack");
const template = Template.fromStack(stack);

test("website bucket blocks all public access", () => {
  template.hasResourceProperties("AWS::S3::Bucket", {
    BucketName: "sombtest-prod-website",
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    },
  });
});

test("website bucket is retained when the stack is deleted", () => {
  const buckets = resourcesOf(template, "AWS::S3::Bucket").filter(
    (r) => r.Properties.BucketName === "sombtest-prod-website",
  );
  expect(buckets).toHaveLength(1);
  expect(buckets[0].DeletionPolicy).toBe("Retain");
  if (buckets[0].UpdateReplacePolicy) {
    expect(buckets[0].UpdateReplacePolicy).toBe("Retain");
  }
});

test("exactly one IAM role trusts the repo's GitHub OIDC subject", () => {
  const roles = resourcesOf(template, "AWS::IAM::Role").filter(
    (r) => r.Properties.RoleName === "sombtest-prod-github-actions-role",
  );
  expect(roles).toHaveLength(1);

  const doc = JSON.stringify(roles[0].Properties.AssumeRolePolicyDocument);
  expect(doc).toContain("token.actions.githubusercontent.com:sub");
  expect(doc).toContain("repo:testowner/testrepo:ref:refs/heads/main");
  expect(doc).not.toContain("StringLike");
});

test("distribution serves index.html as root object", () => {
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: {
      DefaultRootObject: "index.html",
    },
  });
});

test("404 and 403 map to /404.html with status 404", () => {
  const distributions = resourcesOf(template, "AWS::CloudFront::Distribution");
  expect(distributions).toHaveLength(1);

  const config = distributions[0].Properties.DistributionConfig as {
    CustomErrorResponses: ErrorResponse[];
  };
  const byStatus = new Map(config.CustomErrorResponses.map((e) => [e.ErrorCode, e]));
  expect(byStatus.get(404)).toMatchObject({
    ResponsePagePath: "/404.html",
    ResponseCode: 404,
  });
  expect(byStatus.get(403)).toMatchObject({
    ResponsePagePath: "/404.html",
    ResponseCode: 404,
  });
});

test("a CloudFront function rewrites URLs to .html", () => {
  const functions = resourcesOf(template, "AWS::CloudFront::Function");
  expect(functions).toHaveLength(1);
  expect(functions[0].Properties.FunctionCode).toContain(".html");
});

test("hosted zone and certificate cover example.com and www", () => {
  template.hasResourceProperties("AWS::Route53::HostedZone", {
    Name: "example.com.",
  });
  template.hasResourceProperties("AWS::CertificateManager::Certificate", {
    DomainName: "example.com",
    SubjectAlternativeNames: ["www.example.com"],
  });
});
