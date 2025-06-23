---
title: "We are public"
date: 2025-06-19
draft: true
description: "You can read this blog on the web now"
---

First step is done ✅

- Repo and Infrastructure setup
- Pushed and deployed

Now i can focus on new features, fix problems and keep on going.

**And YOU can read it!**

## What now?

While i changed the Frontmatter part in the last post i didnt implement a logic for how "drafts" get published yet. I just wanted to get website online ASAP.

I need to figure out how Nue does custom components like the library to filter the selection of viewable content. If it has `draft: true` i need to ignore it.

In the same time, the pipeline needs to check if a draft got removed or changed to false. Then the `draft` entry can be deleted and the date can be added as the `publishedDate`. In addition the blog entries should show both dates. When i started writing and when the article got published. I think its a nice touch but also useless.

## Other problems

### OIDC

While deploying the infrastructure i got some hurdles that might be a problem for others.

We use an OIDC provider to connect to AWS IAM from the github action. This way we dont need to setup a IAM Access Key or Secret. But this OIDC provider only needs to be configured once per Account. I will probably use an subaccount in the future for this project anyway - therefore i will need the OIDC provider someday. Right now, with my private account, i had already configured the OIDC provider, skipped it in the deployment and imported it.

At least the CDK currently features both implementations but you have to manually change the code in order to work.

### DNS

Kind of the same problem happends with the Route53 HostedZone. I used a new one as a subzone for my main domain. But if you already have a hostedZone with the same name you will get an error. We might need to check the situation with an aws sdk call beforehand.

In addition, the DNS HostedZone gets created but is not connected, therefore the DNS Validation for the certificate will not work directly. This might break the deployment which will then rollback if you do not configure the NS entries fast enough. I think this is not well documented too.

~Sadly Anthropic seems to be down right now for the API which is why my AI-Developer does not want to work. At least this means more time for me to quickly finish this article.~

> Correction: The budget was empty. I got a mail later.

## Next steps

- Better IaC and clear communication with the documentation (imho 5 or 6 files are just to much)
- Implement the newsletter subscribe functions and combine them with the blog
