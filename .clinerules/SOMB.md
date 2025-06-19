# Basic information

This project (SOMB - Snapshot of my brain) is a blogging website inside the /app directory that gets deployed to AWS via Github Action. The infrastructure is defined in the /infrastructure folder.

You can find more information about the project inside the README.md, ARCHITECTURE.md, ROADMAP.md and FUTURE_SAAS.md

## Common commands

    "dev": "cd app && nue",
    "build": "cd app && nue build",
    "build:infra": "bun run build --cwd infra"

## RULES

- Always use bun instead of npm
- Plan AWS ressources with minimal cost requirements, serverless and scalability
- The project will be converted later to multitenant and SaaS. Plan accordingly
- Update all documentation and README's yourself
