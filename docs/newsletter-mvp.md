# Newsletter MVP — Design Spike

Design-only document (plan 008). No production code. Target: the three Core MVP newsletter items from ROADMAP.md. All CDK claims verified against the installed `aws-cdk-lib@2.269.0` in this worktree's `node_modules/aws-cdk-lib` (version confirmed via `node_modules/aws-cdk-lib/package.json`).

## Goals

Deliver the three ROADMAP Core MVP items (ROADMAP.md:7-9), quoted:

> - [ ] Subscriber sign-up (API + front end)
> - [ ] Newsletter send on content push (SES + Action)
> - [ ] Unsubscribe link/endpoint

Non-goals (explicitly out of scope for the MVP build that follows from this document):

- No multi-tenant UI, tenant onboarding, or tenant switching — `tenant_id` is hardcoded to a single value but carried everywhere (see Data model).
- No admin panel / web UI for content or subscriber management (ROADMAP "After MVP" item).
- No contact-form backend (the contact page stays a static mailto link; see Frontend changes for how it can return later).
- No inbound email handling (SES receipt rules), no bounce/complaint automation beyond what the flows require.

## Architecture decision

### Decision A: subscribe/unsubscribe endpoint

| Option | Cost | Moving parts | Failure modes | Verdict |
|---|---|---|---|---|
| API Gateway REST API + Lambda (`apigateway.RestApi` + `LambdaIntegration`; `node_modules/aws-cdk-lib/aws-apigateway/lib/restapi.d.ts`, `.../lambda-api.d.ts`) | API GW ~$3.50/M req + $0.90/M (first 300k free/mo tier) — effectively $0 at blog scale; plus Lambda | RestApi, stage, deployment, Lambda, permissions, CORS preflight config | Stage/deployment drift on redeploy; CORS misconfig; cold start latency on preflight | Workable but heavier than needed for 2 POST routes |
| **Lambda Function URL (`lambda.FunctionUrl`; `node_modules/aws-cdk-lib/aws-lambda/lib/function-url.d.ts:180`)** | $0 beyond free tier (1M req + 400k GB-s free) | One Lambda, one URL, IAM permission for public invocation (`lambda:InvokeFunctionUrl` with `AuthType.NONE` on the function resource policy) | No built-in throttling/WAF (mitigate in-code + optional API-key-style shared check); URL is long (hide behind CloudFront route later or a Route53 `A`/`CNAME` alias — open question) | **RECOMMENDED** — fewest moving parts, free at this scale, CORS handled in Lambda response headers |
| Static hack: `mailto:` link / Google Form / third-party embed | $0 | None in our AWS account | No double opt-in control, no tenant_id model, third-party owns the data, violates AGPL/self-host intent, unreliable deliverability | REJECTED — no data ownership, no path to SaaS, unprofessional UX |

### Decision B: send trigger on publish

| Option | Cost | Moving parts | Failure modes | Verdict |
|---|---|---|---|---|
| **Deploy-workflow step: `curl`/`fetch` a send Function URL with a shared secret (header), after the S3 sync + invalidation step in `.github/workflows/deploy.yml`** | $0 (GitHub-hosted runner already used) | One workflow step + one secret (`SEND_ENDPOINT`, `SEND_TOKEN` as GitHub Actions secrets) | Secret leakage (scoped to repo secrets, single-purpose token, revocable); workflow step timeout if fan-out exceeds job limit — mitigate: send endpoint returns 202 immediately and the Lambda continues asynchronously / defers to per-batch Lambda invocations | **RECOMMENDED** — matches the ROADMAP wording "SES + Action", no new AWS event infra, trivially auditable in workflow logs |
| EventBridge rule on S3 `ObjectCreated` for the bucket (`aws-events` + S3 notification) | $0–$1 (Events pricing) | EventBridge rule, event pattern, permission, plus filtering to *only* publish-triggering uploads — but the deploy workflow uploads **every** changed file, so a plain rule fires per-file; needs prefix filtering (e.g. only `index.html` of new posts) | Over-triggering (every asset upload), no easy way to pass post metadata (title/URL) — would require re-deriving it; re-triggers on redeploys of unchanged posts | Feasible but fighting the deploy shape; rejected for MVP |

Recommended pair: **Function URL for both endpoints + workflow-step trigger with shared secret for send.** Justification: lowest cost, lowest part count, and the deploy workflow already knows exactly what changed (it can pass the post slug/URL in the send payload), which an S3 event cannot.

## Data model

DynamoDB single table (`dynamodb.Table`; `node_modules/aws-cdk-lib/aws-dynamodb/lib/table.d.ts`), on-demand billing, `tenant_id` in the partition key from day one.

Constraints from FUTURE_SAAS.md (quoted):

> "All APIs/DB access accept a `tenant_id` (even if hardcoded for now)"
> "PartitionKey = `tenant_id` + `email` or similar"
> "For email: SES SenderIdentity will need multi-domain support"

Key schema:

- PK: `pk` = `TENANT#${tenant_id}#SUB#${email(lowercased)}` — subscriber item
- GSI1: `pk` = `TENANT#${tenant_id}#STATUS#${status}` → enables Query for all CONFIRMED subscribers of a tenant at send time (`dynamodb.Table` `globalSecondaryIndexes`, same .d.ts)
- A tenant item `TENANT#${tenant_id}` holds config (from-address override, etc.) — future use, MVP writes one row.

Subscriber item attributes:

| Attribute | Type | Notes |
|---|---|---|
| `pk` | S | as above; email lowercased for case-insensitive uniqueness |
| `tenant_id` | S | duplicated as an attribute so every persisted item carries it explicitly (also future key migration) |
| `email` | S | original-cased for sending |
| `status` | S | `PENDING` \| `CONFIRMED` \| `UNSUBSCRIBED` |
| `created_at` | S (ISO 8601) | |
| `confirmed_at` | S | set on opt-in click |
| `confirm_token_hash` | S | SHA-256 of the raw confirm token; raw token never stored |
| `sk` | S | constant `PROFILE` — single-table headroom |

Send-run item (per newsletter send, also tenant-scoped): `pk = TENANT#t#SEND#<timestamp>`, attributes: `post_slug`, `post_url`, `counts`, `status` (QUEUED/DONE/PARTIAL). Enables idempotency: the send Lambda refuses a duplicate send for the same `post_slug` within a window.

APIs all accept (explicitly or via the token's HMAC binding) `tenant_id`; MVP constant: `TENANT_ID = "somb"`.

## SES requirements

- **Domain identity, not email identity**: `ses.EmailIdentity` with a `mail.{{domain}}` subdomain for MAIL FROM (verified in `node_modules/aws-cdk-lib/aws-ses/lib/email-identity.d.ts:271`). A domain identity covers `anything@blog.vmartens.de` and matches the FUTURE_SAAS multi-domain constraint; an email identity would lock us to one address. NOTE: there is **no `aws-sesv2` module in aws-cdk-lib 2.269.0** (`node_modules/aws-cdk-lib` has only `aws-ses` and `aws-ses-actions`) — but `ses.EmailIdentity` in `aws-ses` is the SESv2 identity resource under the hood (its `.d.ts` documents DKIM CNAME records), so identity + DKIM is expressible; anything SESv2-API-only (e.g. contact list management) is NOT available and not used here.
- **DKIM**: `EmailIdentity` emits DKIM CNAME tokens; publish them into the existing Route53 zone created by `infra/lib/constructs/domain.ts` (`DomainConstruct.hostedZone`) using `route53.CnameRecord` (`node_modules/aws-cdk-lib/aws-route53/lib/record-set.d.ts:412`). SPF: `route53.TxtRecord` on the MAIL FROM subdomain with `v=spf1 include:amazonses.com ~all` (record-set.d.ts:431). DMARC TXT on `_dmarc` (policy `none` for MVP, monitoring only).
- **Sandbox**: new SES identities start in sandbox mode — sends allowed only to verified addresses. Production access must be requested via AWS Support (account-level, cannot be automated in CDK). The design assumes sandbox until granted; the flows below work end-to-end with the operator's own verified address during testing.
- **SendEmail vs SendBulkEmail**: the Lambda uses the SESv2 `SendEmail` API (via AWS SDK for JavaScript v3 `SESv2Client`), one call per recipient, with a throttled loop. `SendBulkEmail` (v1 API, up to 50 destinations/call) is rejected: its template-only model (no per-recipient unsubscribe token without Message Tags templating), and it is tied to the SES v1 API surface that the SDK de-emphasizes. Per-recipient `SendEmail` allows injecting the per-subscriber unsubscribe HMAC into the link trivially. Rate: a simple serial loop with `await` suffices at 1k subscribers (SES default send rate for new identities is typically adequate; open question if throttled).

## Flows

### 1. Subscribe (double opt-in)

1. Static form on the Nue site (see Frontend changes) `POST {newsletterBaseUrl}/subscribe` with JSON `{ "tenant_id": "somb", "email": "…" }`.
2. Lambda: validate email shape; lowercase; `PutItem` with `ConditionExpression: attribute_not_exists(pk)` (idempotent re-subscribe: if existing status is UNSUBSCRIBED, flip back to PENDING).
3. Lambda generates a 128-bit random confirm token, stores `confirm_token_hash = sha256(token)`, and sends a confirmation email via SES **to exactly the submitted address** containing `GET {newsletterBaseUrl}/confirm?token=…&tenant_id=…`.
4. Subscriber clicks; Lambda hashes the token, matches against `confirm_token_hash`, sets `status=CONFIRMED`, `confirmed_at`.
5. Responses: 202 on accepted/resent (identical body whether or not the address exists — no enumeration oracle); 400 invalid email; 429 rate-limited (see Security); errors return `{ "error": "…" }` with the same CORS headers.

**Double-opt-in rationale**: prevents third parties from subscribing someone else (anti-spoofing, required posture under GDPR/anti-spam norms), protects sender reputation and deliverability (bounces from fake addresses hurt the SES reputation that governs production-access retention), and gives a clean audit trail (`confirmed_at`).

### 2. Unsubscribe (one click, no login)

1. Every newsletter email contains a footer link `{newsletterBaseUrl}/unsubscribe?t=<token>` where `token = base64url(HMAC_SHA256(secret, subscriber_pk + "|" + post_id))` (see Security).
2. `GET` opens a tiny confirmation page (or POST from a one-button form if GET must stay side-effect-free — open question; default: POST via small inline form so crawlers don't unsubscribe people).
3. Lambda verifies the HMAC, sets `status=UNSUBSCRIBED`. Returns a plain "You're unsubscribed" HTML/text response (no site navigation needed).
4. Errors: invalid/expired token → "link invalid, email us" page; never a stack trace. Unsubscribe is idempotent.

### 3. Send on publish

1. `.github/workflows/deploy.yml`, after sync + invalidation, adds a step: `curl -sf -X POST "$SEND_ENDPOINT" -H "Authorization: Bearer $SEND_TOKEN" -d '{"tenant_id":"somb","post_slug":"…","post_url":"…","title":"…"}'` — endpoint/token are GitHub Actions secrets, not infra `.env`.
2. Send Lambda: verify shared secret; check send-run item for idempotency (same slug already sent → 202 no-op); Query GSI1 for `CONFIRMED` subscribers of the tenant.
3. Fan-out: loop recipients, per-recipient SES `SendEmail` with rendered Markdown→HTML/text body and the per-subscriber unsubscribe HMAC link; throttle serially (Lambda 15-min limit is ample at 1k recipients; if exceeded, chunk into nested async Lambda invocations — TODO marker in sketch).
4. Write send-run item; step output shows counts. Workflow treats non-2xx as failure but does **not** fail the deploy of the site itself (site is already live at that point — `continue-on-error: true` or an explicit `if:` guard; open question).

## Security

- **CORS**: Lambda sets `Access-Control-Allow-Origin: https://blog.vmartens.de` (origin from `app/site.yaml:11`) on every response; rejects other origins' browser calls. Function URLs respond to `OPTIONS` preflight in-code. Non-browser callers are irrelevant (rate-limited anyway).
- **Rate limiting**: no WAF on a Function URL. In-Lambda sliding window using DynamoDB conditional writes (a `RATE#<ip-hash>` counter item with TTL) — e.g. max 5 subscribe calls/IP/10 min. Coarse but sufficient for MVP; document as replaceable with WAF if abuse appears.
- **Unsubscribe token**: `HMAC_SHA256(secret, subscriber_pk + "|" + post_id)` — binds a token to one subscriber AND one post issue, so a leaked link can't unsubscribe anyone else or be replayed across posts; the per-post component also lets a future "re-subscribe from this email" flow. Secret stored in `secretsmanager.Secret` (`node_modules/aws-cdk-lib/aws-secretsmanager/lib/secret.d.ts`), Lambda gets `secretsmanager:GetSecretValue` on that ARN only.
- **Not an open relay**: the subscribe Lambda constructs the destination address solely from the confirmed input field; there is no `to`/`cc`/template parameter in the payload; the only email ever sent goes to the same address that submitted the form. The send endpoint is protected by the shared secret and only sends to `CONFIRMED` subscribers from the table.
- **IAM least privilege**:
  - Subscribe/confirm/unsubscribe Lambda: `dynamodb:PutItem/GetItem/UpdateItem` on the table only.
  - Send Lambda: `ses:SendEmail` restricted via resource condition to the domain identity ARN; `dynamodb:Query` on the table **and its GSI index ARN only** (`grant(..., 'dynamodb:Query', table.tableArn, table.gsi1IndexArn)` pattern); `secretsmanager:GetSecretValue` on the one secret. No `ses:*`, no `dynamodb:*`.
  - The GitHub Actions OIDC role is NOT widened (see Trigger & workflow changes).

## Frontend changes

- New reusable Nue component `app/@components/newsletter-form.ts` (or `.nue` island) rendering an email input + button, styled exclusively with the existing `app/@shared/design/forms.css` conventions (no new CSS paradigm). Submits via `fetch` to the Function URL (absolute, since the site is static and cross-origin), shows inline success ("Check your inbox to confirm") / error states.
- Placement: homepage sidebar/footer and a `/newsletter/` page (site.yaml nav addition).
- The existing `/contact/` page can later gain a real backend by reusing the same Function URL + Lambda pattern (a `contact` route with the same CORS/rate-limit skeleton) — noted, not built in MVP.

## Trigger & workflow changes

Additions to `.github/workflows/deploy.yml` (after the existing sync + invalidation steps):

```yaml
      - name: Trigger newsletter send
        if: github.event_name == 'push'
        continue-on-error: true   # site is already deployed; send failure ≠ deploy failure
        run: |
          curl -sf -X POST "$SEND_ENDPOINT" \
            -H "Authorization: Bearer $SEND_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"tenant_id\":\"somb\",\"post_slug\":\"${{ steps.meta.outputs.slug }}\",\"post_url\":\"https://blog.vmartens.de/blog/${{ steps.meta.outputs.slug }}/\"}"
        env:
          SEND_ENDPOINT: ${{ secrets.SEND_ENDPOINT }}
          SEND_TOKEN: ${{ secrets.SEND_TOKEN }}
```

(A `steps.meta.outputs.slug` derivation step — e.g. from the changed files in `app/blog/` — is part of the implementation plan.)

OIDC role: the current trust policy in `infra/lib/constructs/github-actions.ts` uses `StringLike: repo:${GITHUB_REPO}:*` and grants only S3 read/write/delete + `cloudfront:CreateInvalidation`. The design **must NOT widen this role** — no `ses:*`, no `lambda:InvokeFunction`, no `secretsmanager:*` on it. The send is authorized by the **shared secret** stored as a GitHub Actions repository secret (`SEND_TOKEN`), whose value lives in Secrets Manager (deployed value, manually copied to GitHub once). Rationale: keeping the deploy role minimal means a compromised workflow file can at worst trigger a newsletter send (revocable secret), not read subscriber data or send arbitrary SES.

## Cost estimate

SES $0.10 per 1,000 emails (us-east-1, per AWS SES pricing); DynamoDB on-demand ~$0.25/WCU-M + $1.25/GB-mo storage (25 GB free tier first 12 months); Lambda free tier 1M req + 400k GB-s/mo; Function URL free (included in Lambda); Route53 zone $0.50/mo already paid (existing DomainConstruct). Assumptions: ≤ 2 sends/month, single table < 100 MB, us-east-1, no WAF.

| Scenario | SES | DynamoDB | Lambda + Function URL | Total/mo |
|---|---|---|---|---|
| 0 subscribers | $0 | ~$0 (free tier) | $0 | **~$0** |
| 100 subscribers, 2 sends | 200 emails → $0.02 | ~$0.01 | $0 | **~$0.03** |
| 1,000 subscribers, 2 sends | 2,000 emails → $0.20 | ~$0.05 | $0 | **~$0.25** |

All scenarios are effectively free-tier territory; the dominant risk is not cost but SES sandbox limits (see SES requirements).

## Open questions

| # | Question | Default recommendation |
|---|---|---|
| 1 | Which from address? | `no-reply@blog.vmartens.de` via domain identity (matches domain bought by DomainConstruct); display name "SOMB — Snapshot of my brain" |
| 2 | Unsubscribe via GET (one-click, RFC 8058 `List-Unsubscribe-Post` posture) vs POST form? | POST one-button form page; add `List-Unsubscribe` header pointing at it |
| 3 | Custom domain for the Function URL (e.g. `api.blog.vmartens.de`)? Costs a CloudFront dist or alias. | MVP: raw Function URL (long URL is fine, it's machine-clicked mostly); revisit when the form UX matters |
| 4 | Rendering: Markdown → HTML in Lambda (which renderer, bundle size) vs pre-rendered HTML passed in the send payload? | Pass pre-rendered content URL; Lambda fetches the live post page and extracts/uses it — single source of truth |
| 5 | SES send rate for a fresh identity at 1k recipients — serial loop OK? | Yes; measure during sandbox testing; add chunked async invocation only if needed (TODO in sketch) |
| 6 | Confirm-token TTL? | 7 days, enforced by `created_at` check at confirm time |
| 7 | Should a failed send open a GitHub issue / notify? | MVP: rely on `continue-on-error` + workflow summary line; notification channel is a later plan |
| 8 | tenant_id constant value | `"somb"` in a single shared constant in the implementation |

## Draft construct sketch

Review material for the implementation plan — NOT runnable, uses only constructs verified in `aws-cdk-lib@2.269.0` (paths cited inline).

```typescript
// infra/lib/constructs/newsletter.ts (DRAFT — design sketch only, do not deploy)
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';   // dynamodb.Table — aws-dynamodb/lib/table.d.ts
import * as lambda from 'aws-cdk-lib/aws-lambda';        // lambda.Function, FunctionUrl — aws-lambda/lib/function.d.ts, lib/function-url.d.ts:180
import * as ses from 'aws-cdk-lib/aws-ses';              // ses.EmailIdentity — aws-ses/lib/email-identity.d.ts:271
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'; // Secret — aws-secretsmanager/lib/secret.d.ts
import * as route53 from 'aws-cdk-lib/aws-route53';      // CnameRecord (record-set.d.ts:412), TxtRecord (:431)
import * as iam from 'aws-cdk-lib/aws-iam';

export class NewsletterConstruct extends Construct {
  constructor(scope: Construct, id: string, props: {
    hostedZone: route53.IHostedZone;   // from DomainConstruct
    domainName: string;                // blog.vmartens.de
    tenantId: string;                  // MVP constant "somb" — TODO open question 8
  }) {
    // 1. SES domain identity + DKIM into the existing zone
    const identity = new ses.EmailIdentity(this, 'Identity', {
      domain: props.domainName,                    // domain, not email — see SES requirements
      mailFromSubdomain: 'mail',                   // MAIL FROM subdomain
      dkimIdentity: ses.DkimIdentity.EASY_DKIM,
    });
    // DKIM CNAMEs: EmailIdentity exposes dkimRecords (record-set.d.ts:412 CnameRecord)
    // TODO(open q 1): confirm from-address no-reply@<domain> before finalizing

    // 2. SPF TXT on mail.<domain> and DMARC TXT on _dmarc.<domain> (TxtRecord, record-set.d.ts:431)

    // 3. HMAC secret
    const tokenSecret = new secretsmanager.Secret(this, 'TokenSecret', {
      generateSecretString: { excludePunctuation: true, secretStringTemplate: '{"hmac":""}', generateStringKey: 'hmac' },
    });

    // 4. Table — tenant_id in pk from day one (FUTURE_SAAS.md constraint)
    const table = new dynamodb.Table(this, 'Subscribers', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    table.addGlobalSecondaryIndex({ indexName: 'gsi1', partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING } });

    // 5. Lambdas
    const subscribeFn = new lambda.Function(this, 'SubscribeFn', {
      runtime: lambda.Runtime.NODEJS_22_X, handler: 'index.handler', code: lambda.Code.fromAsset('dist/newsletter'),
      environment: { TABLE_NAME: table.tableName, TENANT_ID: props.tenantId, SITE_ORIGIN: 'https://' + props.domainName, SECRET_ARN: tokenSecret.secretArn },
    });
    table.grantWriteData(subscribeFn);            // scoped to table only
    tokenSecret.grantRead(subscribeFn);           // GetSecretValue on this ARN only

    const sendFn = new lambda.Function(this, 'SendFn', { /* same code asset, handler: 'send.handler' */ } as any);
    table.grant(sendFn, 'dynamodb:Query', table.tableArn, table.tableArn + '/index/gsi1'); // Query on table+GSI only
    identity.grantSendEmail(sendFn);              // ses:SendEmail on the identity only — NO ses:*
    tokenSecret.grantRead(sendFn);

    // 6. Public endpoints (CORS/AuthType NONE, verified function-url.d.ts)
    const url = new lambda.FunctionUrl(this, 'Url', { function: subscribeFn, authType: lambda.FunctionUrlAuthType.NONE });
    new lambda.FunctionUrl(this, 'SendUrl', { function: sendFn, authType: lambda.FunctionUrlAuthType.NONE });
    // sendUrl value + HMAC secret go into Secrets Manager output → manually copied to
    // GitHub Actions secrets SEND_ENDPOINT / SEND_TOKEN (see Trigger & workflow changes).
    // TODO(open q 3): raw Function URL for MVP
    // TODO(open q 5): chunked async fan-out if 1k serial sends exceed limits
  }
}
```

Stack wiring (sketch): `infra/lib/infra-stack.ts` instantiates `NewsletterConstruct` passing `domainConstruct.hostedZone` and `config.domainName`; no changes to `GitHubActionsConstruct` trust or permissions.
