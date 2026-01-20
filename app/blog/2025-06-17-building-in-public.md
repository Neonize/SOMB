---
title: "Building in Public: Why and How"
date: 2025-06-17
publishedDate: 2025-06-17
description: "Starting the SOMB open project—what I'm doing, and why."
---

Today, I began with the setup of a project idea of mine.
According to [Notion](https://www.notion.com) I have written down my thoughts for SOMB on the 30th of December last year (2024) but the idea is quite a bit older I guess.

It started when my old server stopped working after we moved places. It seemed like the old Mac mini didn't survive the sudden loss of power when someone (might have been me) disconnected every cable. The old blog was done with [Grav](https://getgrav.org/) and I still have a backup but I didn't want to just revive the old system. Mainly because I wanted to start from scratch with a new server based on [Proxmox](https://www.proxmox.com) to fix some old design decisions but also because I had nearly no content for my blog anyway.

This marks the new beginning of my blog and hopefully with enough content to come. This project will show my progress building a SaaS from scratch while also being the platform where those posts will be deployed. Kind of a ["Never ending story"](https://en.wikipedia.org/wiki/The_Neverending_Story) self-reference or just simple [dogfooding](https://en.wikipedia.org/wiki/Eating_your_own_dog_food).
The main goal for me is to have a bigger side project with enough interesting aspects, have a topic to write about and showcase my learnings or expertise.

While I will be heavily using AI to plan and develop the project I will write these blog posts by hand.

*At least for now...*

## SOMB in detail

Currently I want to get to an MVP as fast as possible to have a running blog where others can read these entries. Then I will add the newsletter functionality to get the blog article as an email. After that I plan to expand the features, infrastructure and automations to get to an SaaS. Still this whole project will be open-source. Even those SaaS features.

As I wanted to write in Markdown I was searching for a web frontend that displays Markdown directly. I had worked with [Hugo](https://gohugo.io/) before but I didn't quite like the custom components and I was not happy with the design and writing Go for a web project. Then I found [Nue](https://nuejs.org/). The project is quite new and rapidly changing but I hope to implement the main features of rendering Markdown directly with a speedy framework and outputting as a static webpage.

As a static webpage I can just upload the content to an [AWS S3](https://aws.amazon.com/s3/) bucket and put [CloudFront](https://aws.amazon.com/cloudfront/) in front of it for nearly $0 cost.

### Roadmap

1. Get the project off the ground as a kind of MVP
    - Render my Markdown as a blog
    - Have the basic setup for IaC with AWS
    - Project setup and goal is clear
2. Implement the main part of how the Markdown-written blog articles get sent out via email
    - Use AWS SES for email
    - Probably need to write some conversion function to align the layout and look with the webpage
    - Implement newsletter sign-in, sign-out and so on
3. Profit?
    - Probably never. At least not planned right now to make this a paid service

Further ideas I have currently are not scoped to a roadmap yet so I don't want to write them down here in the progressive list.

### Unsorted list

- Admin functionality to see metrics, dashboards, resend newsletter or update the subscriptions
- Implement [Novel](https://novel.sh/) inside the frontend to more easily write new blog posts
  - Change the storage of the Markdown from git to AWS
  - Handle blog updates, resends and so on
- Rewrite the app to be multi-tenant and develop a simple SaaS wrapper
  - Needs to handle different domains
  - How to handle different email addresses and not get marked as spam

## Alternative projects

If you discovered this side-project at this state and want to use it you should probably better use other open-source software.

Some projects I took inspiration from:

- [Grav](https://getgrav.org/) for self-hosting probably or a managed [WordPress](https://wordpress.com/) if you just want to start with your own webpage
- [Ghost](https://ghost.org/) - Finished project I guess? I am not sure how mine differentiates right now
- [listmonk](https://listmonk.app/) - If you only want to send newsletter
- [Awesome self-hosted blogging platforms](https://github.com/awesome-selfhosted/awesome-selfhosted/blob/master/README.md#blogging-platforms)
