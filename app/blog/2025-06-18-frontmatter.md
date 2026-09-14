---
title: "Frontmatter Setup"
date: 2025-06-18
publishedDate: 2025-06-18
description: "Now I am missing the ease of Hugo to generate new files"
---

Writing basic blog posts should not be that complicated but integrating the correct functionality to a Markdown file that gets rendered correctly on the web and on a mail client might be challenging.

I hope I can use the frontmatter of the Markdown files for some additional information.

## All beginnings are hard

Starting with an empty file is always hard. But with frontmatter you at least have guidance on what to fill in and what will be used later by the website. Now the problem is to keep these metadata documents up to date, integrate all needed information and update old posts too.

My goal would be to provide the basics when writing or create a template to copy.

```markdown
title: "This represents the current state"
date: 2025-06-18
description: "You have to fill in everything by hand and update the date if you need more than one day to publish"
tags: [currently, these, are, not, used]
```

As you can see a template is easy but no fun to change the date all the time.

In addition the current folder logic, of keeping the files inside an `entries` folder is not helpful either.

## Changes to be done

- Move the entries over to the `app/blog` folder
- Differentiate the blog articles by "draft" [like Hugo does it](https://gohugo.io/content-management/front-matter/)
- Add a template somewhere and a command to create a new entry with the current date
- Add the "publishedDate" via pipeline and only show that on the blog page

## Open questions

- How many "basic" blogging features do I want to implement?
- How to organize the blog folder?
- How to update the articles after they have been published?
- I probably have to keep a unique identifier for each blog entry even if I change the title
  - Background: When I send out a newsletter the URL can't be changed anymore
  - I thought about using the git commit ID but that does not work for the SaaS multi-tenant system later on

## New Frontmatter

```markdown
title: "Whatever you want to write about"
date: 2025-06-18
draft: true [OR publishedDate if published]
description: "You have to fill in everything by hand and update the date if you need more than one day to publish"
```
