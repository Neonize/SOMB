# Extending to SaaS/Multi-Tenant

While the basic MVP is single-user, everything is built with the goal of allowing multi-tenant SaaS later.

## Notes and TODOs

- All APIs/DB access accept a `tenant_id` (even if hardcoded for now)
- Data model can be extended to support multiple sites/accounts:
  - PartitionKey = `tenant_id` + `email` or similar
- Blog/static site build structure allows for multiple blogs per deployment (folder-per-tenant, planned)
- For email: SES SenderIdentity will need multi-domain support
- User authentication system (e.g., Cognito) will be componentized
- All migration steps and lessons learned will be blogged openly

**Contributions and ideas welcome — follow my journey in the blog!**
