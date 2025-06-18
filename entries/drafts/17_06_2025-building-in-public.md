---
title: "Building in Public: Why and How"
date: 2025-06-17
description: "Starting the SOMB open project—what I'm doing, and why."
tags: [meta, journey]
---

Today, I began with the setup of a project idea of mine.
According to [Notion](https://www.notion.com) i have written down my thoughts for SOMB on the 30th of december last year (2024) but the idea is quite a bit older i guess.

It started when my old server stopped working after we moved places. It seemed like the old Mac mini didnt survive the sudden loss of power when someone (might have been me) disconnected every cable. The old blog was done with [Grav](https://getgrav.org/) and i still have a backup but i didnt want to just revive the old system. Mainly because i wanted to start from scratch with a new server based on [Proxmox](https://www.proxmox.com) to fix some old design decisions but also because i had nearly no content for my blog anyway.

This marks the new beginning of my blog and hopefully with enough content to come. This project will show my progress building a SaaS from scratch while also beeing the platform where those posts will be deployed. Kind of a ["Never ending story"](https://en.wikipedia.org/wiki/The_Neverending_Story) self-reference or just simple [dogfooding](https://en.wikipedia.org/wiki/Eating_your_own_dog_food).
The main goal for me is to have a bigger side project with enought interesting aspects, have a topic to write about and showcase my learnings or expertise.

While i will be heavily using AI to plan and develop the project i will write these blogposts by hand.

*At least for now...*

## SOMB in detail

Currently i want to get to an MVP as fast as possible to have a running blog where others can read these entrys. Then i will add the newsletter functionality to get the blog article as an email. After that i plan to expand the features, infrastructure and automations to get to an SaaS. Still this whole project will be opensource. Even those SaaS features.

As i wanted to write in Markdown i was searching for a webfrontend that displays markdown directly. I had worked with [Hugo](https://gohugo.io/) before but i didnt quite like the custom components and i was not happy with the design and writing go for a webproject. Then i found [Nue](https://nuejs.org/). The project is quite new and rappidly changing but i hope to implement the main features of rendering markdown directly with a speedy framework and outputing as a static webpage.

As a static webpage i can just upload the content to an [AWS S3](https://aws.amazon.com/s3/) bucket and put [Cloudfront](https://aws.amazon.com/cloudfront/) in front of it for nearly 0 $ cost.

### Roadmap

1. Get the project of the ground as a kind of MVP
    - Render my markdown as a blog
    - Have the basic setup for IaC with AWS
    - Project setup and goal is clear
2. Implement the main part of how the markdown writte blog articles get sendout via Mail
    - Use AWS SES for mail
    - Probably need to write some conversion function to align the layout and look with the webpage
    - Implement newsletter sign-in, sign-out and so on
3. Profit?
    - Probably never. At least not planned right now to make this a paid service

Further ideas i have currently are not scoped to a roadmap yet so i don't want to write them down here in the progressiv list.

### Unsorted list

- Admin functionality to see metrics, dashboards, resend newsletter or update the subscriptions
- Implement [Novel](https://novel.sh/) inside the frontend to more easily write new blogposts
  - Change the storage of the markdown from git to AWS
  - Handle blog updates, resends and so on
- Rewrite the app to be Multitenant and develop a simple SaaS wrapper
  - Needs to handle different domains
  - How to handle different mail adresses and not get marked as spam

## Alternative projects

If you discovered this sideproject at this state and want to use it you should probably better use other Opensource software.

Some projects i took inspiration from:

- [Grav](https://getgrav.org/) for selfhosting probably or a managed [Wordpress](https://wordpress.com/) if you just want to start with your own webpage
- [Ghost](https://ghost.org/) - Finished project i guess? I am not sure how mine differentiates right now
- [listmonk](https://listmonk.app/) - If you only want to send newsletter
- [Awesome selfhosted blogging platforms](https://github.com/awesome-selfhosted/awesome-selfhosted/blob/master/README.md#blogging-platforms)
