# Changelog

All notable changes to this project will be documented in this file.

## [0.6.2] - 2025-12-11

### Changes

- feat(blog): implement DirectusRepository with @directus/sdk ([f70d659](https://github.com/sbozh-me/website/commit/f70d659df3a123888c1a6a5e613f4fbc34490061))
- docs(blog): update README with DirectusRepository usage ([4af64d6](https://github.com/sbozh-me/website/commit/4af64d6cc29195c914db63e6c79a50b82cd8fba1))


## [0.6.1] - 2025-12-11

### Changes

- feat(web): implement Directus schema seeding for blog backend ([2f691dc](https://github.com/sbozh-me/website/commit/2f691dc1b1d7cd6a37201ae25c5103451dd961c4))
- docs(directus): add README with setup instructions ([076a99a](https://github.com/sbozh-me/website/commit/076a99ae64b0b20a8b5cc8d241d4e9a927de6b60))


## [0.6.0] - 2025-12-10

### Changes

- docs(roadmap): add detailed breakdown for v0.6.0 Blog Backend ([946298b](https://github.com/sbozh-me/website/commit/946298bfe734352f68be4f584e40b334b0087145))
- feat(web): add Directus CMS backend setup with Docker Compose ([5c11da2](https://github.com/sbozh-me/website/commit/5c11da2e2ced30c75a4b49d4b6fee0554340749e))
- feat(release): add --ignore flag to skip coverage validation ([7166359](https://github.com/sbozh-me/website/commit/7166359c979eb1fd53fad5c8e6be0f836b2ca9a2))


## [0.5.3] - 2025-12-09

### Changes

- feat(blog): implement post page components and MDX rendering ([87ce7c4](https://github.com/sbozh-me/website/commit/87ce7c4cd8061b770f49369943bdc7d01973d62f))
- feat(blog): add optional image support to blog posts ([51ad5d7](https://github.com/sbozh-me/website/commit/51ad5d7005a6a12fb7d198df2ae64d2e2482b2bb))
- style(blog): update TOC to use design system color tokens ([5f33978](https://github.com/sbozh-me/website/commit/5f339780cd368faef26cf878783df8ff50ffa3aa))
- refactor(blog): use design system color tokens in code.css ([e5f5ac0](https://github.com/sbozh-me/website/commit/e5f5ac0b5db93c0087484cd7bbd13396103b1c0c))
- feat(blog): add scroll-to-top button component ([87f1453](https://github.com/sbozh-me/website/commit/87f1453167b1c46a4dfc3fab78903a8c0ec979e8))
- feat(blog): add click handler for immediate TOC active state update ([632b1f9](https://github.com/sbozh-me/website/commit/632b1f971b7b45b77c59e2068cff014454968465))
- docs(roadmap): add email subscription milestone and renumber versions ([9fe3d81](https://github.com/sbozh-me/website/commit/9fe3d81189626f1610fc8544e432f91944bf94b2))
- feat(blog): improve TableOfContents mobile UX ([8590b9e](https://github.com/sbozh-me/website/commit/8590b9e8d94604338786a5c4c49413fda316d192))
- docs(roadmap): mark blog layouts milestone as complete ([8515cb6](https://github.com/sbozh-me/website/commit/8515cb6e1991bfeaed531d964c393cce3e18a556))
- fix(deps)!: patch critical RCE vulnerabilities in React and Next.js ([8f47ace](https://github.com/sbozh-me/website/commit/8f47ace2815ab086660372a9587957b60d216ca2))
- docs: add blog package documentation and update main README ([d38b88e](https://github.com/sbozh-me/website/commit/d38b88ef8f644556b1d9f70927cb2cb03d2041d1))


## [0.5.2] - 2025-12-08

### Changes

- feat(blog): implement filter components and state management for post filtering ([e81be01](https://github.com/sbozh-me/website/commit/e81be019824082c9360ca355953e5580e782b98c))
- feat(ui): integrate shadcn components across packages ([404f996](https://github.com/sbozh-me/website/commit/404f99696b85739f1b160412c0c967f10aa9ebdb))


## [0.5.1] - 2025-12-07

### Changes

- feat(blog): implement Timeline components with date grouping and formatting utilities ([e1980d9](https://github.com/sbozh-me/website/commit/e1980d91f6910231f6294b2e3f323ca776229818))
- feat(web): add blog timeline demo with mock data ([43713b1](https://github.com/sbozh-me/website/commit/43713b1641a30ff1ef8570b6d4c9be2b68f092cd))
- chore: update globals.css and lockfile ([e5e2b3d](https://github.com/sbozh-me/website/commit/e5e2b3dc7c1e6202fc1e5659947a1d0a23ae8a12))


## [0.5.0] - 2025-12-07

### Changes

- docs(roadmap): add comprehensive blog implementation plan (0.5.0-0.5.5) ([eb85451](https://github.com/sbozh-me/website/commit/eb8545113fd0c85f2ac66980d013a761145072af))
- feat(blog): implement blog package with repository pattern and mock data ([2e3e444](https://github.com/sbozh-me/website/commit/2e3e4448b8ba1f4021ec33bd8a41b135fdee4b52))
- build(deps): update lockfile for blog package dependencies ([562bd73](https://github.com/sbozh-me/website/commit/562bd73b1a29e0e74923ba83a23cd8c07dada8c4))
- test(cv): add PDF route tests and exclude API from coverage ([4ee7c02](https://github.com/sbozh-me/website/commit/4ee7c02c43fcc701da92efd43bf2b18043fb8e75))


## [0.4.5] - 2025-12-06

### Changes

- fix(cv): hide page title in print view ([bb451de](https://github.com/sbozh-me/website/commit/bb451de0a216aecfc1099d0228a573aca3861c6c))
- feat(cv): add PDF download functionality ([467898c](https://github.com/sbozh-me/website/commit/467898c3479439534837103d50b9c0f5718cd3a5))
- feat(ui): add Sonner toast with Obsidian Forge theme ([02fd74c](https://github.com/sbozh-me/website/commit/02fd74cfb1da87c604152d33e819c71003d247f6))
- feat(pmdxjs): add spark syntax and styled links for CV ([3c13dae](https://github.com/sbozh-me/website/commit/3c13daed39afc980e88c581747b06758053619f5))
- fix(pmdxjs): correct tests and semantic markup ([09320db](https://github.com/sbozh-me/website/commit/09320db042f181861a6a24acd6ca48586533aa5b))
- docs: update README files with pmdxjs features and CV page status ([45f468f](https://github.com/sbozh-me/website/commit/45f468f030045287b5862ffb0afcc030647de3da))


## [0.4.4] - 2025-12-06

### Changes

- feat(pmdxjs): implement extensible parser API for custom directives ([c4f790c](https://github.com/sbozh-me/website/commit/c4f790c62b7c66de996d7c75041fd311913bf455))
- wip(cv): implement CV page with PMDXJS and professional styling ([e53d54a](https://github.com/sbozh-me/website/commit/e53d54a78512cb2111bc5234c73208089c59aeef))
- feat(parser): add list item support ([6bb4221](https://github.com/sbozh-me/website/commit/6bb4221e5b44c2037b5bca58f266ac9c27432e47))
- fix(page): use fixed height instead of minHeight for exact dimensions ([f45c8d2](https://github.com/sbozh-me/website/commit/f45c8d2122b872c77f2e9b57ed8db792c94d720a))
- refactor(pmdxjs): convert Columns to CSS Grid layout ([28b8494](https://github.com/sbozh-me/website/commit/28b84948f756ed6c5be53b1ee696371264f5864a))
- feat(pmdxjs): add page overflow detection with developer warnings ([f8f6042](https://github.com/sbozh-me/website/commit/f8f604236d9723dfecf661cfaf0274448737c4f4))
- feat(pmdxjs): add horizontal overflow detection for columns ([a3d69cd](https://github.com/sbozh-me/website/commit/a3d69cdcb4bf7cf0c23dbc070a4141f9541b4e44))
- feat(pmdxjs): add inline formatting support for bold, italic, and links ([bcd2955](https://github.com/sbozh-me/website/commit/bcd2955aa019f03b46e4a34f29c8e056de144a6c))
- feat(cv): redesign CV with Obsidian Forge theme system ([26c5a69](https://github.com/sbozh-me/website/commit/26c5a69994b2d80252409a61e68623b4bca47ddc))
- refactor(cv): move theme and print buttons inside CV container ([48daa0f](https://github.com/sbozh-me/website/commit/48daa0fac4577448dce209daaedf273d4586a6cb))
- fix(cv): update print styles and use UI button components ([be98eeb](https://github.com/sbozh-me/website/commit/be98eeb4aa8bacd56b40290e5e54a2cb4d58ea7a))
- feat(cv): add responsive scaling for mobile devices ([13eb607](https://github.com/sbozh-me/website/commit/13eb6071182f36f65d1529c155a53137f63b0860))
- refactor(home): extract spark animation to separate component ([e226705](https://github.com/sbozh-me/website/commit/e226705d67f426935fd78468210c4b6d7ba68ced))
- feat(pmdxjs): auto-link contact items in CV header ([2760c22](https://github.com/sbozh-me/website/commit/2760c227bea33ad881dc969362add3cdb48bb842))
- test(cv): update tests for redesigned CV page ([d568e44](https://github.com/sbozh-me/website/commit/d568e44788d6240543e54432bbd09ecdfe478440))
- test(cv): add error handling test for compile failures ([4ae969b](https://github.com/sbozh-me/website/commit/4ae969b47335f90a75b939f596a72d2a4a0667e7))


## [0.4.3] - 2025-12-05

### Changes

- feat(pmdxjs): implement milestone 0.4.3 - MDX browser runtime ([dcc9b9f](https://github.com/sbozh-me/website/commit/dcc9b9fc20e21c51f001433dce51d07cd84f39eb))


## [0.4.2] - 2025-12-05

### Changes

- feat(pmdxjs): implement milestone 0.4.2 - CV-specific components ([428ec79](https://github.com/sbozh-me/website/commit/428ec7911ffac1bad9de047aab321df888745a26))
- docs(pmdxjs): add CV components section to README ([410364a](https://github.com/sbozh-me/website/commit/410364a5fc8ba09173b51dc1ab9f5f83ce4f6608))


## [0.4.1] - 2025-12-04

### Changes

- feat(pmdxjs): implement milestone 0.4.1 - core layout components ([caf0c81](https://github.com/sbozh-me/website/commit/caf0c81953a5cf391507ee7ddc946a92939ccbcd))
- chore(deps): update lockfile for pmdxjs 0.4.1 dependencies ([5420575](https://github.com/sbozh-me/website/commit/54205757516f0f565df020de21f57f5ab8cdcece))
- docs(pmdxjs): add package README ([66e36c4](https://github.com/sbozh-me/website/commit/66e36c4edc027a369c8e8404bb31bb4876c81cbe))


## [0.4.0] - 2025-12-04

### Changes

- docs(roadmap): simplify milestones and remove animated logo phase ([fa2b07d](https://github.com/sbozh-me/website/commit/fa2b07d1e6726897d44aee6824e60deb8f909ee1))
- docs(roadmap): add PMDXJS milestone documentation ([7ace2af](https://github.com/sbozh-me/website/commit/7ace2af4846588d3f83b083cd4c1c2a01c97aebc))
- feat(pmdxjs): implement milestone 0.4.0 - package scaffold and basic parser ([d3b2a47](https://github.com/sbozh-me/website/commit/d3b2a47c3919d24c3694519092c9be935b9264be))
- docs(readme): add pmdxjs package to structure section ([c22848d](https://github.com/sbozh-me/website/commit/c22848dc21cf71275817242e17f67a434e22acc5))


## [0.3.0] - 2025-12-04

### Changes

- test(home): update tests for new tagline and remove tech stack test ([babda69](https://github.com/sbozh-me/website/commit/babda6906e20477ef8ba3d52a7c1d8262b9b5363))
- docs: update README with Obsidian Forge design and mark 0.3.0 complete in ROADMAP ([0f17f15](https://github.com/sbozh-me/website/commit/0f17f15d05e6d8818c45fb736f62e7fc7c6e8485))

## [0.2.4] - 2025-12-04

### Changes

- feat(home): update subtitle to 'Personal startup' with spark mark ([25d177c](https://github.com/sbozh-me/website/commit/25d177c515019d333549462bd4ba1f1ea651699e))
- refactor(home): remove tech stack section from homepage ([8245a54](https://github.com/sbozh-me/website/commit/8245a54d36c201f5f31f3e4c8c489da93cdc3bb2))

## [0.2.3] - 2025-12-04

### Changes

- feat(ui): add responsive hamburger menu to header ([dfe9640](https://github.com/sbozh-me/website/commit/dfe9640ec43d3fdd643ac3605afaab6b167865eb))

## [0.2.2] - 2025-12-04

### Changes

- feat(ui): implement Obsidian Forge motion design system ([7f42933](https://github.com/sbozh-me/website/commit/7f429331f2a9e15ec778708f90d4bba1b6dc1b46))

## [0.2.1] - 2025-12-04

### Changes

- feat(design): implement Obsidian Forge design system ([6eb0969](https://github.com/sbozh-me/website/commit/6eb0969e75160c1c78ce0ff76bf2c29568048808))
- style(ui): update text selection to 40% opacity primary color ([3115713](https://github.com/sbozh-me/website/commit/311571324ffa42c23c6a16ad045ff85ce5fb4f61))

## [0.2.0] - 2025-12-04

### Changes

- docs: update README and mark 0.2.0 complete in roadmap ([1bc6cf3](https://github.com/sbozh-me/website/commit/1bc6cf3b9829a0c2be04d74aaedd4df29ccf8579))

## [0.1.3] - 2025-12-04

### Changes

- test(web): update and add tests for 100% coverage ([2dffe7a](https://github.com/sbozh-me/website/commit/2dffe7a1f28ecb77600aaa2a943e908e5bb548c1))

## [0.1.2] - 2025-12-04

### Changes

- feat(web): implement portfolio website structure with navigation and core pages ([f744c74](https://github.com/sbozh-me/website/commit/f744c74d031ee5b8542b93644f735c914884fd52))
- refactor(web): simplify footer and improve homepage layout ([e29d1f3](https://github.com/sbozh-me/website/commit/e29d1f32d63ea8dc24a5ce4783a84ba9939b8b1d))

## [0.1.1] - 2025-12-04

### Changes

- docs: update README with react-ui package ([bcc5510](https://github.com/sbozh-me/website/commit/bcc5510428de7f2fce4188f2e86d51f12fd7dd43))
- chore(release): v0.1.0 ([d404c10](https://github.com/sbozh-me/website/commit/d404c10e6aad1618f353132311c4e0af262b36a0))
- docs: add project roadmap ([82f6a2f](https://github.com/sbozh-me/website/commit/82f6a2fa23c33ecd6b7680a0895448649b8ddf60))

## [0.1.0] - 2025-12-03

### Changes

- docs: update README with react-ui package ([bcc5510](https://github.com/sbozh-me/website/commit/bcc5510428de7f2fce4188f2e86d51f12fd7dd43))

## [0.0.4] - 2025-12-03

### Changes

- test(web): add Home page tests ([1db7f20](https://github.com/sbozh-me/website/commit/1db7f204c50e9e255f7a9011e0a6a257041f6aeb))

## [0.0.3] - 2025-12-03

### Changes

- feat(react-ui): add shared UI package with shadcn/ui ([dff90d8](https://github.com/sbozh-me/website/commit/dff90d812e88d0f5e88608558b122997a309584b))
- feat(web): integrate Tailwind CSS v4 and shared UI components ([911d0d8](https://github.com/sbozh-me/website/commit/911d0d89aeb70402ab079b35f653a503ca566723))

## [0.0.2] - 2025-12-03

### Changes

- docs: add README ([ec42d8e](https://github.com/sbozh-me/website/commit/ec42d8e1f55c53b9f6db254041d057ca701b72bf))
- docs: add Claude Code guidelines ([04847f9](https://github.com/sbozh-me/website/commit/04847f99a3fdd92bafcf36e679ee534afe770c7c))

## [0.0.1] - 2025-12-03

### Changes

- chore(tooling): initialize Claude Code configuration ([ea8b13f](https://github.com/sbozh-me/website/commit/ea8b13f2edb73fee018f4d45b87e7271fa9a77b7))
- feat(init): bootstrap monorepo with Next.js and tooling infrastructure ([efd1f6b](https://github.com/sbozh-me/website/commit/efd1f6bd605011cf0715f215d4c51030b72097b2))
- refactor(config): improve TypeScript and ESLint configuration strictness ([5d8ed77](https://github.com/sbozh-me/website/commit/5d8ed77c6e096b065d321889ec3ed51a8961ee25))
- feat(test): implement Vitest testing infrastructure with coverage support ([4086196](https://github.com/sbozh-me/website/commit/408619619a01493ae993e9a99f30feff98eba723))
- build: add Makefile for release automation ([c034a7d](https://github.com/sbozh-me/website/commit/c034a7dc249f2ae17281d7d8803def3f8e58a333))
