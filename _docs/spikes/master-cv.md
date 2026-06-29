<!-- last-updated: 2026-06 --> 
<!-- purpose: source of truth - never send this directly; use extractor-prompt.md -->

---

## Contact
- **Phone:** +40.723.320.336
- **Email:** paul.alex.serban@gmail.com
- **Portfolio / Blog:** [paulserban.eu](https://paulserban.eu/)
- **LinkedIn:** [linkedin.com/in/paulalexs](https://www.linkedin.com/in/paulalexs/)
- **GitHub:** [github.com/paulAlexSerban](https://github.com/paulAlexSerban)
- **Location:** Bucharest / Cluj-Napoca, Romania

---

## Headline

Senior AI & Full-Stack Engineer · Agentic AI Control Planes · High-Throughput Platform Engineering · Distributed Systems

---

## Professional Summary

Senior AI & Full-Stack Engineer with 6+ years translating complex architectural constraints into high-performance, production-ready systems. Specialized in Agentic AI control planes, microservice architectures, and internal platform tooling - with a track record of eliminating 90%+ QA cycle overhead, reducing operational bottlenecks from hours to minutes, and winning international hackathons under 48-hour time pressure. The engineer you hire when you need systems that scale, pipelines that don't break, and architecture decisions that age well.

<!-- tags: ai-engineering, full-stack, platform, architecture, leadership, aws, mern, python -->

---

## Technical Skills

```
AI & Agentic Systems  | AWS Bedrock (LLM inference, RAG), AgentCore, Prompt Engineering, Agentic Workflows
Core Architecture     | Node.js, TypeScript, Python, Event-Driven Microservices, Monorepo (pnpm/Turborepo)
Frontend              | React.js, Next.js (CSR/SSG/SSR/App Router), SCSS/ITCSS/BEM, Vite, Webpack
Cloud & Platform      | AWS (S3, CloudFront, Lambda, EC2, IAM), Kubernetes, Docker, Terraform
Observability         | Datadog, Grafana + Loki + Prometheus, ClickHouse
CI/CD & DevOps        | Buildkite, GitHub Actions, GitOps, ArgoCD, Jenkins
Practices             | TDD, ADRs/ASRs, System Design, Spec-Driven Development, WCAG AA, i18n
Blockchain – Exp.     | Sui, Move, Rust (smart contracts), dApp architecture, custom indexers
```

---

## Work Experience

### Senior Software Engineer - FanDuel @ Betfair Romania Development S.R.L.

<!-- tags: ai-engineering, full-stack, platform, aws, bedrock, python, mern, k8s, docker, terraform, microservices, micro-frontends, observability, ci-cd, leadership, agile, monorepo --> <!-- level: senior | type: full-time | start: 2024-04 -->

**Bucharest, Romania · April 2024 – Present** _Python · AWS Bedrock · AgentCore · Pytest · Node.js · React · Next.js · TypeScript · MongoDB · K8s · Docker · Terraform · Buildkite · GitHub Actions · Datadog · Grafana · Loki · Prometheus · ClickHouse_

Part of the FanDuel Group (under Flutter Entertainment), engineering within Betfair Romania's division. Scope spans Agentic AI platform engineering, internal tooling, game provider integrations, and cross-functional technical leadership across three online casino slots platforms.

#### AI & Automation Platforms

- **Architected and led delivery of the AI-powered exploratory and regression testing platform** using Python, Pytest, AWS Bedrock (LLM inference), and AgentCore. Chose serverless agent execution (AgentCore) over persistent compute to eliminate infrastructure management overhead and enable per-test cost isolation at scale.
  - **Slashed QA process time for new state launches from ~3 months with 5–10 QEs to ~1 week with 1–3 QEs (90% reduction)** across 3,000+ games and 4 production platforms.
  - **Accelerated BAU game launches from ~20 to ~100+ games per week (5× increase)** without additional headcount, running tests outside business hours.
  - **Saved ~150 hours of manual QA per week** by enabling AI-augmented test coverage for all new and BAU game launches.

    <!-- tags: ai-engineering, python, aws-bedrock, agentcore, pytest, automation, platform, llm, agentic-ai -->

- **Led the cross-company rollout of the AI testing platform across Flutter Entertainment divisions** — scaling it from an internal tool into a Platform-as-a-Service adopted across the group, extending QA acceleration company-wide and establishing a centralised AI-augmented testing capability at Flutter scale.

    <!-- tags: ai-engineering, platform, leadership, flutter, paas, rollout -->

- **Eliminated a 6-hour daily manual bottleneck** in gaming ops by engineering an internal Node.js/React workflow tool automating full game configuration across 20 games and 5 US states. **Reduced batch onboarding from 6 hours to 6 minutes (95% reduction)** — enabling 5× more weekly game launches without additional headcount.

    <!-- tags: full-stack, node, react, automation, internal-tooling, operational-excellence -->

#### Game Provider Integration & User Experience

- **Owned the integration layer between internal product teams and 3rd-party casino slot game providers** — maintained 5 microservices and 2 micro-frontends in a MERN monorepo on K8s/AWS. Introduced bi-directional contract testing, a shared config layer, and a standardised deployment pipeline — **cutting per-provider integration time from 3 months to 1 month (66% reduction)**.

    <!-- tags: microservices, micro-frontends, mern, monorepo, k8s, aws, integration, mobile, leadership -->

- **Identified and eliminated the static asset security exposure in game provider microservices**: analysed the serving architecture, proposed and led the migration of all frontend static assets from Node.js microservices to S3/CloudFront. **Removed Node.js from the static serving path — shrinking the attack surface when new Node.js CVEs are disclosed and fully decoupling server-side Node.js upgrades from frontend application releases.**

    <!-- tags: architecture, aws, s3, cloudfront, security, microservices, adrs, devops -->

- **Identified a systemic architectural flaw in game provider session management** after cross-functional review: providers kept sessions open post-exit, forcing re-authentication on game switch. Led architectural review meetings, proposed the solution, and drove the ADR to resolve it. **Analytics reported a 75% increase in user retention on games previously abandoned** due to session friction — directly attributable to the frictionless game switch fix.

    <!-- tags: architecture, adrs, game-provider, user-retention, session-management, leadership -->

- **Architected a soft game launch solution** using pre-fetching of game application assets hosted on internal infrastructure — eliminating cold-start delays and **reducing game launch time by up to 6 seconds**, directly improving session engagement for players entering new games.

    <!-- tags: performance, game-launch, pre-fetching, architecture, user-experience -->

- **Initiated and built cross-platform game launch observability dashboards** after identifying the absence of provider-level performance monitoring in tech-product meetings. Dashboards surfaced multiple providers with consistently slow launch speeds — enabling targeted infrastructure scale-up interventions with those providers. **Analytics subsequently reported a 50% user retention increase on games that had previously been abandoned due to slow launch performance.**

    <!-- tags: observability, datadog, game-launch, performance, user-retention, leadership -->

#### Platform, Architecture & Observability

- **Designed and led the implementation of a Stale-While-Revalidate (SWR) caching strategy** in the CMS data aggregation service — which was timing out regularly under slow CMS response conditions. **Reduced service timeout incidents by 99%**, eliminating the primary source of content delivery failures for game configuration data.

    <!-- tags: architecture, caching, swr, node, reliability, platform -->

- **Formulated and led the migration of a legacy webpack React SSR application to a modern Next.js setup** with SSR and SSG hosting. Improved landing page Core Web Vitals across all measured dimensions and **reduced frustrated user clicks by 75%** as reported by analytics — directly improving first-impression conversion performance.

    <!-- tags: next-js, react, ssr, ssg, performance, core-web-vitals, migration -->

- **Proposed and drove platform-level ADRs with direct cost and performance impact:**
  - Migrated static assets from EC2 to S3/CloudFront — eliminated EC2 egress costs and reduced delivery latency.
  - Introduced LLM response caching for the AI testing platform — reduced AWS Bedrock inference spend and improved p95 response time for repeated test scenarios.

    <!-- tags: architecture, adrs, aws, s3, cloudfront, bedrock, cost-optimisation -->

- **Designed and maintained multi-environment release pipelines** on Buildkite and GitHub Actions — covering K8s manifests, Lambda deployments, and S3/CloudFront static publishing with environment promotion, secret injection, and rollback strategies for zero-downtime releases.

    <!-- tags: ci-cd, buildkite, github-actions, k8s, lambda, s3, cloudfront, devops -->

- **Instrumented full-stack observability across the platform:** built Datadog dashboards tracking game launch latency and error rates per game provider; deployed Grafana/Loki/Prometheus stacks for frontend and backend monitoring; instrumented the AI testing platform with ClickHouse for test run analytics and failure trend detection.

    <!-- tags: observability, datadog, grafana, loki, prometheus, clickhouse, monitoring -->

- Currently **contributing to the architectural migration from a custom-built API gateway and service mesh to Kong API Gateway and Kong Service Mesh** — reducing bespoke maintenance overhead and standardising traffic management across the platform.

    <!-- tags: kong, api-gateway, service-mesh, architecture, platform, migration -->

#### Technical Leadership & Cross-Functional Influence

- **Established the operational foundation for the game provider integration team**: authored playbooks, runbooks, and onboarding procedures from scratch — standardising incident response and reducing new-joiner time-to-productivity across the team.

    <!-- tags: leadership, team, playbooks, runbooks, onboarding, mentorship -->

- **Led mid and senior engineer interviews across all hiring rounds since joining** — every engineer hired following my evaluation proved an exceptional fit and demonstrated significant growth under team mentorship.

    <!-- tags: leadership, hiring, interviews, mentorship -->

- **Operated at company-wide architectural scope**: maintained regular alignment with Principal Engineers, Architects, technical leads, and Product teams — ensuring game provider integration architecture and platform decisions remained consistent with Flutter-level engineering strategy.

    <!-- tags: leadership, architecture, alignment, principal-engineers, cross-functional -->

---

### Front-End Software Engineer - Cognizant Netcentric

<!-- tags: frontend, typescript, react, aem, adobe-experience-manager, webpack, vite, scss, accessibility, i18n, enterprise, agile, client-facing --> <!-- level: mid-to-senior | type: full-time | start: 2019-11 | end: 2024-04 -->

**Bucharest, Romania · November 2019 – April 2024** _Adobe Experience Manager (AEM) · TypeScript · JavaScript · React.js · Webpack · Vite · SCSS · ITCSS · BEM · Storybook · Jest · Chromatic_

Built and maintained enterprise-grade front-end solutions for financial, automotive, and healthcare clients on Adobe Experience Manager. Led design and development across multiple concurrent client projects in an Agile environment.

#### Key Contributions

- **Cut build time 50% and bundle size 30%** by migrating the component library and build pipeline from Webpack to Vite on a major Swiss banking enterprise project - eliminating slow feedback loops that blocked daily developer iteration.

    <!-- tags: vite, webpack, build-tooling, performance, migration -->

- **Reduced new-developer onboarding from 3 weeks to 1 week** by introducing ITCSS architecture and BEM naming conventions across 3 projects - standardising the CSS layer and eliminating style regression incidents that previously required senior-engineer intervention.

    <!-- tags: itcss, bem, css-architecture, scalability, onboarding -->

- **Eliminated third-party state management dependency** by engineering a Flux-based custom state solution - reducing bundle weight, lowering the learning curve for mid-project joiners, and removing a version-lock risk.

    <!-- tags: state-management, flux, react, architecture -->

- **Achieved WCAG AA compliance across 26 Swiss locales** by delivering an accessible, multi-level navigation component with full i18n support for a financial-sector client under regulatory accessibility requirements.

    <!-- tags: accessibility, wcag, i18n, internationalisation, localisation -->

- **Led Brush-up and Redesign of Swiss Banking Website:** Led the brush-up and redesign of the Swiss banking website (with 1.5 million web pages) for a financial-sector client - ensuring compliance with accessibility requirements and improving the user experience while improving FE performance (core web vitals), performance (bundle size, build time), accessibility (WCAG AA), and SEO (structured data, meta tags, canonical URLs).

    <!-- tags: aem, typescript, react, enterprise, client-facing, agile, sprint, api-integration, accessibility, wcag, i18n, internationalisation, localisation, core-web-vitals, performance, bundle-size, build-time, structured-data, meta-tags, canonical-urls -->

- Engineered enterprise front-end components on AEM (Custom FE setup, TypeScript, React, ITCSS, BEM, Storybook, Jest, Chromatic) for clients in financial, automotive, and healthcare sectors - consistently delivering Agile sprint commitments on time including complex bug-fixes, high-performance features, and third-party API integrations.

    <!-- tags: aem, typescript, react, enterprise, client-facing, agile, sprint, api-integration -->

---

## Freelance & Consulting Work

### Independent Software Engineering Consultant - paulserban.eu

<!-- tags: freelance, wordpress, aws, devops, mern, python, automation, ai-engineering, gdpr, marketing-tech, n8n --> <!-- level: senior | type: freelance | start: 2020 -->

**Romania + Western European clients · 2020 – Present**

Full-service freelance practice serving Romanian local businesses and Western European clients across WordPress, MERN, Python, AWS, DevOps, and AI engineering. Positioned as the GDPR-compliant alternative for EU clients: replaced cloud automation platforms (Make/Zapier) with self-hosted n8n to eliminate data sovereignty risk.

#### Selected Projects

- **Festival Email Marketing System (3sof.com):** Engineered end-to-end email marketing pipeline - Klaviyo + UTM tracking + Zapier/iaBilet integration + WordPress REST API click-logging plugin + Google Apps Script automation - enabling full attribution tracking for a live events client.

    <!-- tags: marketing-tech, klaviyo, wordpress, automation, zapier, utm, google-apps-script -->

- **Self-Hosted Log Analytics Stack:** Built a Python-based CloudFront log fetcher + Loki + Grafana stack on Docker Compose deployed on AWS ECS - enabling independent log analytics without cloud-vendor lock-in or egress fees.

    <!-- tags: aws, cloudfront, python, loki, grafana, docker, aws, observability, devops -->

- **Provate Theatre & Arts School Website:** Built the website for a private theatre and arts school in Romania - Phoenix Art School based on WordPress Full Site Editor (FSE), custom plugins and site structure. Integrating it with the school's existing CRM system and allowing the school to manage the website content themselves.

    <!-- tags: wordpress, fse, custom-plugins, site-structure, crm, integration, leadership -->

- **GDPR-Compliant Analytics Pipeline:** Deployed server-side Google Tag Manager via Docker on a Hetzner VPS - eliminating third-party cookie exposure for EU clients operating under GDPR constraints. Eliminating third-party cookie exposure allowed us to reduce the monthly cost of the analytics solution from 100 EUR to 50 EUR.

    <!-- tags: gtm, server-side, docker, hetzner, gdpr, analytics, devops -->

- **n8n Self-Hosted Automation:** Set up and operate self-hosted n8n on Hetzner as a privacy-safe alternative to Make/Zapier for automation-heavy client workflows - evaluated and documented trade-offs across four platforms to justify the architectural decision. With this setup we were able to replace a monthly recurring fee of 100 EUR with a one-time setup cost of 100 EUR and a monthly maintenance cost of 50 EUR.

    <!-- tags: n8n, automation, gdpr, hetzner, self-hosted, devops -->

- **Shopfy Custom Product Feed Manipulation Plugin:** Built a custom Shopify plugin that allows the client to manipulate the product feed before it is published to the Shopify store.

    <!-- tags: shopify, custom-product-feed, manipulation, plugin, leadership -->

---

## Hackathons

<!-- tags: hackathons, leadership, blockchain, ai-engineering, python, next-js, node, move, sui -->

### 1st Place - Comets of Web3 (48h Hackathon) · November 2025

**Invoice Financing dApp on Sui Blockchain** _Next.js · Move · Rust · Sui Blockchain · Smart Contracts_

Outpaced 50+ international teams by architecting and shipping a production-viable decentralised invoice financing application end-to-end in 48 hours. Led a team of 4 engineers through full-stack delivery: Next.js web app hosted on Vercel + Move/Rust smart contracts on the Sui blockchain hosted on Sui Foundation's testnet.

[Try it out](https://chain-invoice.vercel.app/) · [Code](https://github.com/paulAlexSerban/on-chain-invoice-financing-n-settlement)

<!-- tags: blockchain, sui, smart-contracts, move, rust, next-js, leadership, dapp, defi -->

### Jury Prize - Betfair AI Hackathon (24h Hackathon) · December 2025

**AI-Powered PR Test Coverage Analyser** _Python · AI Workflows · GitHub API · Jira API · LLMs_

Led a 3-person team to design, architect, and ship an AI infrastructure tool in 24 hours that analyses PR diffs across repositories, cross-references impacted services against Jira-defined e2e test cases, and surfaces intelligent coverage gap recommendations using LLM workflows. Selected for Jury Prize from the full company-wide cohort.

While development in progress, we were able to find several P1 and P2 issues in the production application and reported them to the team.

<!-- tags: ai-engineering, python, llm, github-api, jira-api, agentic-ai, testing, devops, leadership -->

### 2nd Place - Sui Foundation Bootcamp (8h Hackathon) · November 2025

**Project Management App on Blockchain** _Next.js · Node.js · PostgreSQL · Move · Sui Blockchain · Blockchain Indexer_

Led a team of 4 to deliver a blockchain-native project management application - including a custom Node.js/PostgreSQL indexer service - in an 8-hour sprint.

[Try it out](https://moveit-move.vercel.app/) · [Code](https://github.com/paulAlexSerban/moveit.move)

<!-- tags: blockchain, sui, smart-contracts, move, node, postgres, next-js, leadership, indexer -->

---

## Personal Projects

### paulserban.eu - Portfolio & Technical Blog

<!-- tags: writing, content, seo, mdx, astro, next-js, aws, ci-cd, jamstack -->

**2020 – Present**

Long-form technical blog targeting professional engineers and technical leads. Built on Next.js SSG (JAMStack), deployed on AWS via GitHub Actions CI/CD. Publishes deep-dive content across AI engineering, distributed systems, DevOps, and architecture at high volume using a structured MDX + SEO metadata pipeline. Topics include: Python, DAGs/ETL, CQRS, ADRs, tRPC, microservices, Kong API Gateway, ArgoCD/GitOps, Kubernetes networking, Big O notation, and more.

It allowed me to share my knowledge and learnings with the community and to get feedback on my work, also callback learnings from my past work.

---

## Education

### B.Sc. Software Engineering

<!-- tags: education, software-engineering, iu -->

**IU International University of Applied Sciences, Germany**  
Up to date modern software engineering degree from a private university in Germany with focus on hands-on learning and practical applications.

### Full Stack Open

<!-- tags: education, full-stack, node, react, helsinki -->

**University of Helsinki, Finland**  
Deep-dive programme in modern full-stack development: React, Node.js, REST, GraphQL, TypeScript, Testing, CI/CD, Containers.

### Bachelor's-Level Diploma in Web Development

<!-- tags: education, web-dev, openclassrooms, frontend -->

**OpenClassrooms, France**  
Specialised in front-end web development. Full-cycle project management: client requirements → architecture → implementation. Applied OOP, unit and integration testing, performance optimisation, accessibility, responsive design, and SQL database querying.

---

## Languages

- **Romanian** - Native
- **English** - Professional (written and spoken)
- **Spanish** - Conversational

---

## Notes for Extractor

> When generating a tailored resume from this file:
> 
> - Use the `<!-- tags: ... -->` annotations to match entries against the job description
> - Always rewrite the Profile Summary and Headline from scratch for each role
> - Prioritise recent experience (Betfair/FanDuel) unless the JD calls for something specific from earlier roles
> - For AI/ML roles: emphasise Bedrock, AgentCore, agentic workflows, Pytest AI automation, Flutter PaaS rollout, the Betfair AI Hackathon
> - For full-stack/platform roles: emphasise MERN, microservices, internal tooling, CI/CD, SWR cache, Next.js migration, operational impact metrics
> - For frontend roles: emphasise Cognizant Netcentric experience, AEM, React, WCAG AA, build tooling wins, Next.js SSR/SSG migration, Core Web Vitals
> - For DevOps/infra roles: emphasise K8s, Docker, Terraform, Buildkite, Grafana stack, ADRs, S3/CloudFront security migration, Kong API Gateway, static asset architecture
> - For security-conscious roles: emphasise static asset migration (CVE attack surface reduction), Node.js decoupling, ADRs
> - For product/user-impact roles: emphasise retention metrics (75% game switch, 50% launch speed), game launch pre-fetch (-6s), frustrated clicks (-75%), SWR (-99% timeouts)
> - For leadership/staff/principal roles: emphasise cross-functional alignment with Principal Engineers and Architects, hiring rounds, playbooks/runbooks, team foundation, Flutter-wide PaaS rollout, hackathon leadership
> - Hackathon section is strong for demonstrating rapid delivery, leadership, and technical breadth — include unless JD is very narrow
> - Cut the Freelance section entirely for senior corporate roles unless the JD values consulting/broad scope
