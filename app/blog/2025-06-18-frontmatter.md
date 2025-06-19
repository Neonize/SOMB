---
title: "Frontmatter setup"
date: 2025-06-18
publishedDate: 2025-06-18
description: "Now i am missing the ease of hugo to generate new files"
---

Writting basic blog posts should not be that complicated but integrating the corrrect functionality to a markdown file that gets rendered correctly on the web and on a mail client might be challeging.

I hope i can use the frontmatter of the markdown files for some additional informations.

## All beginnings are hard

Starting with an empty file is always hard. But with frontmatter you at least have a guidance what to fill in and what will be used later by the website. Now the problem is to keep these metadata documents up to date, integrate all needed informations and update old posts too.

My goal would be to provide the basics when writting or create a template to copy.

```markdown
title: "This represents the current state"
date: 2025-06-18
description: "You have to fill in everything by hand and update the date if you need more than one day to publish"
tags: [currently, these, are, not, used]
```

As you can see a template is easy but no fun to change the date all the time.

In addition the current folder logic, of keeping the files inside an `entries` folder is not helpfull either.

## Changes to be done

- Move the entries over to the `app/blog` folder
- Differentiate the blog articles by "draft" [like hugo does it](https://gohugo.io/content-management/front-matter/)
- Add a template somewhere and a command to create a new entrie with the current date
- Add the "publishedDate" via pipeline and only show that on the blog page

## Open questions

- How many "basic" blogging features do i want to implement?
- How to organise the blog folder?
- How to update the articles after they have been published?
- I probably have to keep a unique identifier for each blog entry even if i change the title
  - Background: When i send out a newsletter the url cant be changed anymore
  - I thought about using the git commit id but that does not work for the SaaS multitenant system later on

## New Frontmatter

```markdown
title: "What ever you want to write about"
date: 2025-06-18
draft: true [OR publishedDate if published]
description: "You have to fill in everything by hand and update the date if you need more than one day to publish"
```
