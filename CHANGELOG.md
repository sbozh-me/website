# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0] - 2026-01-14

### Changes

- chore: mark 1.4.0 main page improvements as complete ([151b895](https://github.com/sbozh-me/website/commit/151b895fee19fe9a9f4de04772796ec7fc85bd97))
- feat(home): add animations to BlogPostGrid component ([ad677cb](https://github.com/sbozh-me/website/commit/ad677cb5c5fb7b45b0b17d5446e566d4f5764892))
- perf(home): cache author posts to reduce refetch on carousel navigation ([05046b5](https://github.com/sbozh-me/website/commit/05046b5e4be99a740c7fb602ccd94808789a85a6))
- chore(release): v1.3.16 ([457fe0e](https://github.com/sbozh-me/website/commit/457fe0e1879f29da16bac1219f88f68aba4d4ed6))
- perf(home): replace React state stars with native DOM animation ([2f9553c](https://github.com/sbozh-me/website/commit/2f9553c55dfd82f14f7fa18a409a7890e1ebd646))
- test: update homepage and projects page tests ([b47d680](https://github.com/sbozh-me/website/commit/b47d6809c7b0df9435601da03ac93ba154701c33))
- docs: add falling stars performance postmortem ([5dfa2f0](https://github.com/sbozh-me/website/commit/5dfa2f0167f5b4bcf809697ba0324967c2c79188))


## [1.3.16] - 2026-01-14

### Changes

- chore: mark 1.4.0 main page improvements as complete ([151b895](https://github.com/sbozh-me/website/commit/151b895fee19fe9a9f4de04772796ec7fc85bd97))
- feat(home): add animations to BlogPostGrid component ([ad677cb](https://github.com/sbozh-me/website/commit/ad677cb5c5fb7b45b0b17d5446e566d4f5764892))
- perf(home): cache author posts to reduce refetch on carousel navigation ([05046b5](https://github.com/sbozh-me/website/commit/05046b5e4be99a740c7fb602ccd94808789a85a6))


## [1.3.15] - 2026-01-13

### Changes

- feat(home): implement dynamic blog post filtering by author ([ffba1ef](https://github.com/sbozh-me/website/commit/ffba1efce420a06d2349dbf94a124671482a7f2c))
- perf(home): debounce author carousel navigation requests ([6cef5ca](https://github.com/sbozh-me/website/commit/6cef5ca98dd65b996c62ef07f8a16ac0ff06740a))


## [1.3.14] - 2026-01-13

### Changes

- refactor(home): rename Persona to Author across carousel components ([b225145](https://github.com/sbozh-me/website/commit/b225145475b980dab3d84789944ec82f4bb2bb4f))
- feat(home): add BlogPostGrid with 2 posts and More posts button ([28f2326](https://github.com/sbozh-me/website/commit/28f2326868aa26eeae3aa9dce815d76a1de6c82b))
- style(home): make BlogPostGrid responsive with fluid 2-col layout ([917c341](https://github.com/sbozh-me/website/commit/917c34136753e992229329dbe6de5755b573015a))
- refactor(ui): simplify card styles and use PostCard from blog package ([29f06dc](https://github.com/sbozh-me/website/commit/29f06dc7ffca59372697197571351bcb94926d4f))


## [1.3.13] - 2026-01-13

### Changes

- docs(roadmap): restructure v1.4.0 main page improvements into iterative releases ([e8151c9](https://github.com/sbozh-me/website/commit/e8151c9850629ab0e123d6735a8c0ea0fb9fd50f))
- feat(home): add persona carousel with multi-identity navigation ([2172c65](https://github.com/sbozh-me/website/commit/2172c656d7c22e3bd6b4c0a331b0fdff89bd0d6a))
- chore(dev): add lines of code counter script ([270eeb9](https://github.com/sbozh-me/website/commit/270eeb9153e7a0634cac562ac3c5b25482c5ecdf))
- feat(layout): move header to root layout and disable initial carousel animation ([1579bb1](https://github.com/sbozh-me/website/commit/1579bb16fb918da2090541c7be6fd425f0da2ee1))
- feat(header): add personal startup tagline with favicon and easter egg tooltip ([be19a7d](https://github.com/sbozh-me/website/commit/be19a7d68368593d7ca990ad4a5525bdeeb78140))
- style(header): adjust favicon size and positioning ([e825bb0](https://github.com/sbozh-me/website/commit/e825bb0eb2e25f98bc8128be02d725945d244685))
- fix(carousel): disable swipe drag on desktop, keep only for mobile ([3062c31](https://github.com/sbozh-me/website/commit/3062c317afb5fd99fee67f33164b796c5fe3089f))
- fix(carousel): set fixed height based on tallest card to prevent jumping ([584dce3](https://github.com/sbozh-me/website/commit/584dce307014d70740dc853549434e969f271e53))
- style(carousel): make navigation arrows always visible ([13b3bf1](https://github.com/sbozh-me/website/commit/13b3bf1b883fd7174d5bb5738ba959756d0e5820))
- feat(carousel): add logo placeholder visible during slide transitions ([e9fbfd4](https://github.com/sbozh-me/website/commit/e9fbfd4205f269fbc45753edab9bd420ea1b7b53))
- feat(carousel): add debounce for rapid clicking with logo display ([5a28126](https://github.com/sbozh-me/website/commit/5a28126960cb1f67a0ce5c1043c2bd89dd9f596f))
- feat(carousel): add falling star easter egg after 5 rapid clicks ([a0a9a15](https://github.com/sbozh-me/website/commit/a0a9a1597da31802e4bc68d7c733b1d1d3148c4b))
- feat(persona): add status badges and avatar images ([fe24202](https://github.com/sbozh-me/website/commit/fe242024c031d8878cb549c966b97cfcde44f485))
- feat(home): add easter egg to Viktor's 'Who is that?' button ([bbd80a9](https://github.com/sbozh-me/website/commit/bbd80a9fbd68bb94192647e3510591b360d3d09a))
- fix(home): improve PersonaCarousel mobile layout and measurement ([94f2d15](https://github.com/sbozh-me/website/commit/94f2d150a34b3d3f085d6f40feb737908c38ba12))
- feat(home): add loading state and fade-in animation to PersonaCarousel ([43fc228](https://github.com/sbozh-me/website/commit/43fc22822a42b3a242fef72b566ccddcf6c41ab2))
- feat(home): triple star spawn rate and increase max stars ([8d0119b](https://github.com/sbozh-me/website/commit/8d0119bb4f5ec8142c77bc68f11ea1e68417537c))
- fix(home): prevent animation break on rapid navigation clicks ([52fa950](https://github.com/sbozh-me/website/commit/52fa950d03e3378b01e43c987028202355f7960a))


## [1.3.12] - 2026-01-11

### Changes

- chore(projects): update discord community status to active ([2861b7a](https://github.com/sbozh-me/website/commit/2861b7a32762f1352d99f027797b80202792d8d5))


## [1.3.11] - 2026-01-11

### Changes

- fix(projects): update discord invite link ([0a78e53](https://github.com/sbozh-me/website/commit/0a78e53fa5efa22634a6069e44f843fef7ad8576))


## [1.3.10] - 2026-01-11

### Changes

- docs: add release notes idea to backlog ([f931bea](https://github.com/sbozh-me/website/commit/f931beaabc20f194b31f8718f445faaa60f5b94d))
- fix(contact): replace Discord link with LinkedIn ([16637dd](https://github.com/sbozh-me/website/commit/16637dd5a15a1d321784803b948181ddea3911f2))
- feat(discord): update community to private access model ([8158f0d](https://github.com/sbozh-me/website/commit/8158f0d8d7511d4d500e0be2e0401e9e03888bac))


## [1.3.9] - 2026-01-10

### Changes

- fix(projects): exclude releases tab from dynamic route generation ([aab0024](https://github.com/sbozh-me/website/commit/aab0024eebecf248a586484f5f299b42076d3e61))


## [1.3.8] - 2026-01-10

### Changes

- docs(roadmap): mark completed release notes items ([21f4ee1](https://github.com/sbozh-me/website/commit/21f4ee1f353ae74228fe7b9eaabcb7dcb828544a))
- fix(themes): use kognitiv blue for text selection color ([265981b](https://github.com/sbozh-me/website/commit/265981be3c8ee7ef4f6189083d47b1511ad15720))


## [1.3.7] - 2026-01-10

### Changes

- feat(releases): add Latest badge to release detail page ([9392b11](https://github.com/sbozh-me/website/commit/9392b11ad25b2262fd9aa9f04ad84116be6ac2a4))
- feat(sitemap): add release detail pages to sitemap ([2095842](https://github.com/sbozh-me/website/commit/2095842fc7416892ebd33d2afab510c204b2ccb7))


## [1.3.6] - 2026-01-10

### Changes

- refactor(releases): fix breadcrumb hydration using route groups ([516ea51](https://github.com/sbozh-me/website/commit/516ea519958e523c8652d604a5ff66bcf53460d5))
- feat(releases): add scroll to title on release detail page ([f507891](https://github.com/sbozh-me/website/commit/f507891c31ffd8943706c1a38fd9f57fd7f9c540))
- fix(scroll): handle missing scrollIntoView in test environment ([e419b91](https://github.com/sbozh-me/website/commit/e419b91ef54c172f971b2c21d28f40f2f2b253f1))


## [1.3.5] - 2026-01-10

### Changes

- docs: update ROADMAP.md ([cc7effe](https://github.com/sbozh-me/website/commit/cc7effe001fa75af37d2eadd93e07208c3db1dc1))


## [1.3.4] - 2026-01-10

### Changes

- docs: update ROADMAP.md ([74f0d82](https://github.com/sbozh-me/website/commit/74f0d826981c53ca1938c0f4f19cdaa3de4e9ec1))


## [1.3.3] - 2026-01-10

### Changes

- docs: update ROADMAP.md ([3bf99a2](https://github.com/sbozh-me/website/commit/3bf99a2f03fcf8a5793c1bfff8be44157855179a))


## [1.3.2] - 2026-01-10

### Changes

- fix(releases): mark release detail page as dynamic ([507901a](https://github.com/sbozh-me/website/commit/507901ad3ac871f28206f0dcbf8255161a1e9f99))


## [1.3.1] - 2026-01-10

### Changes

- fix(releases): make projectSlug prop optional in ReleaseTimelineWithLoadMore ([7b84bea](https://github.com/sbozh-me/website/commit/7b84bea45b817146201f5c880056e218fa2a8596))
- fix(release-notes): ensure isLatest prop is boolean type ([4192f6d](https://github.com/sbozh-me/website/commit/4192f6d9c4a80fcf2537201ba8031196ff65faab))
- fix(release-notes): add next as peer dependency ([16202b8](https://github.com/sbozh-me/website/commit/16202b87a842b5e2077820fc1df447fad71e24ed))
- chore: update pnpm-lock.yaml ([90f82b8](https://github.com/sbozh-me/website/commit/90f82b8d2c392ef29e7a878372376a55d82211da))


## [1.3.0] - 2026-01-10

### Changes

- fix(docker): add themes and release-notes packages to Dockerfile ([2abc697](https://github.com/sbozh-me/website/commit/2abc697e24b7de3cab64d08756552f3df2ca48f9))
- docs(claude): update theming module with kognitiv and loader overlay ([a4fed5b](https://github.com/sbozh-me/website/commit/a4fed5b96ceddb5e5091671596abaccae463040b))
- feat(pmdxjs): add markdown link support for company names in entries ([c165b68](https://github.com/sbozh-me/website/commit/c165b68cf1e6ab492afad9a7b6164cc60af2b01b))
- feat(release-notes): implement timeline UI and main page integration ([821e609](https://github.com/sbozh-me/website/commit/821e609cb50f3b5b4eb3507d8192af459f12d708))
- docs(claude): add error UI handling module ([c29e6ce](https://github.com/sbozh-me/website/commit/c29e6ceaf46fc33dacc8ab6c14d000cf56bc7a23))
- docs(claude): add stricter co-activation guidance to cognitive interviewer ([30eec10](https://github.com/sbozh-me/website/commit/30eec1058aa1a6ce8e2626e05b6b3fdd31686407))
- fix(release-notes): use correct collection name release_notes ([3db1eed](https://github.com/sbozh-me/website/commit/3db1eed97349c64276812ca83b70cd5912de678a))
- feat(release-notes): add MDX support for release summaries ([46ab1e7](https://github.com/sbozh-me/website/commit/46ab1e7a8195ba3f317e2b5fd3ee78d6432358bc))
- refactor(release-notes): simplify timeline layout with border-based design ([b122e9d](https://github.com/sbozh-me/website/commit/b122e9d3ff0292b7b54a867e816329cd495b287d))
- style(web): update globals.css ([2408ef8](https://github.com/sbozh-me/website/commit/2408ef815af174f4306500702df88cce6e07d24f))
- docs(roadmap): update v1.3.0 scope and move items to backlog ([e939041](https://github.com/sbozh-me/website/commit/e939041832920ba9742d5131dadedca695a4bd13))
- refactor(release-notes): improve timeline entry layout and styling ([6f4232f](https://github.com/sbozh-me/website/commit/6f4232f33ec2c59e6d1baf111c6e5b304d7d7a39))
- docs(release-notes): update module documentation to reflect production state ([68e6a8e](https://github.com/sbozh-me/website/commit/68e6a8e5bbbc8d3f0b618b77ee314340d481221c))
- feat(release-notes): add pagination with load more button for main page timeline ([c79f0f2](https://github.com/sbozh-me/website/commit/c79f0f24b5e3249c9270082259eae9da5555e44a))
- feat(release-notes): enhance timeline with Vercel-style design ([07e2772](https://github.com/sbozh-me/website/commit/07e277278b5a57a61e2a6aa298354312979611b4))
- feat(release-notes): add visual enhancements and version-based latest badge ([5ddd261](https://github.com/sbozh-me/website/commit/5ddd261f976dc62640b3ade8f9537238d50ab269))
- refactor(release-notes): remove collapse functionality from timeline entries ([48ed34c](https://github.com/sbozh-me/website/commit/48ed34cf8630577a0e0bf4ac9dbb139deff685a9))
- feat(releases)!: consolidate changelog, roadmap, and release notes into unified /releases page ([b09d4d3](https://github.com/sbozh-me/website/commit/b09d4d30c1e05b679e6b27329625b0bc2ba10a6a))
- feat(release-notes): add slug-based routing and reading time calculation ([48c1e8b](https://github.com/sbozh-me/website/commit/48c1e8be0df772b99ba00d11dcf948dcc02b1bc4))
- feat(releases): add individual release detail pages with navigation ([3472b2c](https://github.com/sbozh-me/website/commit/3472b2c4efe7854664c7951c6b733a26b2cab72f))
- fix(releases): filter release notes by project slug ([65ce88f](https://github.com/sbozh-me/website/commit/65ce88f5cb1a9c8ff37d397b71c0e94ec38e8f69))
- fix(release-notes): adjust timeline dot vertical alignment ([249439e](https://github.com/sbozh-me/website/commit/249439e0ccd5fb81e97c9a9549736ad3ffad8630))
- test(releases): add comprehensive tests for release pages and components ([7fe6103](https://github.com/sbozh-me/website/commit/7fe61033e3cfa273c0ec516eaa3bf8751687e003))
- fix(tests): update sitemap and page tests for releases feature ([34eb7b0](https://github.com/sbozh-me/website/commit/34eb7b090d713ce3e30f92512d356d06b23090c2))
- test(releases): add error handling test coverage ([16666bf](https://github.com/sbozh-me/website/commit/16666bfd63020128c82e726cd805bc671b91c3b8))
- fix(releases): use project.title instead of project.name ([f94542e](https://github.com/sbozh-me/website/commit/f94542ea69c738870c0ea4985303e1e5a3ec6cf2))


## [1.2.8] - 2026-01-08

### Changes

- fix(themes): add react to devDependencies for Docker build ([1489dc3](https://github.com/sbozh-me/website/commit/1489dc336332bc2ed434ce1823bc06ede1de8c41))
- chore: update lockfile ([b3d519a](https://github.com/sbozh-me/website/commit/b3d519ae5d8d80daff3bdbc8c56a9a85b7ba2d09))


## [1.2.7] - 2026-01-07

### Changes

- refactor(claude): use PROJECT_ROOT env for cognitive script paths ([9ac7534](https://github.com/sbozh-me/website/commit/9ac7534c2abd984b21da733139b6eedf26f7ebb2))
- feat(release-notes): add release notes package with Directus repository pattern ([96b8213](https://github.com/sbozh-me/website/commit/96b821377bfbd6457802f5f6fe47a2601bda8ca7))
- docs(claude): add Obsidian Forge design system cognitive context ([7963c4b](https://github.com/sbozh-me/website/commit/7963c4bddfd434d7ad50f6a30d6c0fd744913f15))
- feat(themes)!: extract theme system into @sbozh/themes package ([ce60797](https://github.com/sbozh-me/website/commit/ce607975935cd52a0977a6658dbe02d1041cd83a))
- docs(claude): add theming module to cognitive context system ([6290578](https://github.com/sbozh-me/website/commit/6290578f00e9900ff9f72d36fc00a6effa56604b))
- refactor(themes): extract typography variables to obsidian-forge theme ([e6c3550](https://github.com/sbozh-me/website/commit/e6c35500439d22d817fa519063486faa197fd64b))
- refactor(themes): add TOC variables to typography theme ([3307563](https://github.com/sbozh-me/website/commit/3307563d3217179dcd90dda18dc74b81bede5b09))
- refactor(themes): move blog CSS to themes package and refactor ThemeProvider to controlled mode ([6a37cad](https://github.com/sbozh-me/website/commit/6a37cad10ce2a3043d5e1430344fa3c808645a15))
- docs(claude): update theming module documentation ([b31e980](https://github.com/sbozh-me/website/commit/b31e980ac9801fa5439ff59b8cdd77beb76237c4))
- refactor(themes): consolidate CSS imports into single theme entry point ([8002b8d](https://github.com/sbozh-me/website/commit/8002b8d559ffb6b270923ed1f2cdb803e8e0e3d8))
- feat(themes): add KOGNITIV techno-thriller theme ([1ee4068](https://github.com/sbozh-me/website/commit/1ee406860cad344de89d187eb8037bb547de7ffa))
- docs(claude): update release-notes module documentation ([e89e047](https://github.com/sbozh-me/website/commit/e89e047fd6b61d282e8df7c59f9b7d33d5a60c68))
- feat(themes): add per-article theming with KOGNITIV theme for techno-thriller aesthetic ([8efd421](https://github.com/sbozh-me/website/commit/8efd421ee6a4139d9139160d062282c015b68f49))
- fix(blog): center content when TOC hidden and remove prose width limit in KOGNITIV ([7089597](https://github.com/sbozh-me/website/commit/70895979ac108cdd097952b541104a9b6c869f5c))
- feat(themes): add blocking theme loader overlay ([ea8332c](https://github.com/sbozh-me/website/commit/ea8332c0e56ae9b2d69d86ba4a679531ac028a81))
- docs(postmortem): add release notes component location analysis ([0d0132b](https://github.com/sbozh-me/website/commit/0d0132b0d2c8507ac09c26a625d347bec860acf3))


## [1.2.6] - 2026-01-04

### Changes

- docs: simplify README by removing detailed sections ([8469758](https://github.com/sbozh-me/website/commit/8469758b57841c6ff001ce7028fb657bc1fa842b))
- docs(roadmap): add versions 1.3-1.6 and update subscription timeline ([9462746](https://github.com/sbozh-me/website/commit/946274625a64371ac65680e96962e787a0ded548))
- docs: add claude cognitive setup interview ([5a09768](https://github.com/sbozh-me/website/commit/5a09768d89dc8adcc71513f2a9ff863ce76e84e8))
- feat(dx): implement Claude Cognitive persistent context system ([6e5c652](https://github.com/sbozh-me/website/commit/6e5c652f47306f725f509337833ec98d4b05fd91))
- feat(claude): add cognitive context management scripts ([229d742](https://github.com/sbozh-me/website/commit/229d742b6853fed9d1e1b3591c3b282511e513c3))
- docs(claude): restructure cognitive context system with Garret agent and focused modules ([33b772b](https://github.com/sbozh-me/website/commit/33b772b21f481b593a14180ad053b099578b142f))
- chore(claude): add garret skill command ([258b86b](https://github.com/sbozh-me/website/commit/258b86b494598aef16999b600950b705f92adb18))
- feat(claude): add ROADMAP.md to context router ([2962a4b](https://github.com/sbozh-me/website/commit/2962a4be32085468dcba46f3a05ec87da2a9c578))
- docs(claude): add Garret cognitive interviewer documentation ([8dd26a6](https://github.com/sbozh-me/website/commit/8dd26a6eceb097a1e02852e5bd2f99f0f5c562e1))
- chore(directus): use env vars for database credentials ([59041ce](https://github.com/sbozh-me/website/commit/59041ce30b162bcd58836875db4335d1eda1ac32))
- docs(roadmap): add prev/next post navigation to backlog ([6a6aa99](https://github.com/sbozh-me/website/commit/6a6aa9958ce972fb2dcfd3b25a36093990311a5c))
- chore(directus): add full schema snapshot ([601f1f1](https://github.com/sbozh-me/website/commit/601f1f126523941e3eef64d7378be6d1249f9e9d))
- docs(claude): add local Directus workflow and improve Garret guidelines ([47a4ed3](https://github.com/sbozh-me/website/commit/47a4ed37a05910d947f29ab68855710f5da37bce))
- feat(blog): add per-post ToC visibility control ([ebe0212](https://github.com/sbozh-me/website/commit/ebe0212b6d245e7555bc8fc00fa3eb6164d0125f))


## [1.2.5] - 2025-12-31

### Changes

- feat(web): add X (Twitter) link to footer ([75132a1](https://github.com/sbozh-me/website/commit/75132a1007b98593599e3ff4eadf0aea729ef947))


## [1.2.4] - 2025-12-31

### Changes

- docs(backlog): add ideas ([f752227](https://github.com/sbozh-me/website/commit/f752227f8c57c3898e2c93494927547cfbb127be))
- fix(pmdxjs): remove blank second page from CV print ([b5261b4](https://github.com/sbozh-me/website/commit/b5261b4dec2ba965d0f0305dcf6ea8e172622766))


## [1.2.3] - 2025-12-31

### Changes

- feat(blog): add border to table of contents on mobile ([f17c96c](https://github.com/sbozh-me/website/commit/f17c96c175ebd21c0a1ecb40ba9936400c165bbd))


## [1.2.2] - 2025-12-31

### Changes

- fix(web): prevent double animation on page load ([76cf807](https://github.com/sbozh-me/website/commit/76cf807a547c4c790a951330dfc9a78558fe132a))


## [1.2.1] - 2025-12-30

### Changes

- fix(web): use date_published for blog sitemap lastmod ([441efe1](https://github.com/sbozh-me/website/commit/441efe1792f04266b90b2cb1e8f5b69f28869bce))


## [1.2.0] - 2025-12-29

### Changes

- chore(web): update sitemap metadata ([7e4646d](https://github.com/sbozh-me/website/commit/7e4646d4692ca05c5d5062469fb7cf9f02d8a2e2))
- feat(web): add custom 404 page with random blog post suggestion ([449697f](https://github.com/sbozh-me/website/commit/449697f526f9f57d576b04855b45853afe24968d))
- feat(web): add animations to 404 page ([3526439](https://github.com/sbozh-me/website/commit/35264392bf0d8056d4ba8078aa347290b1f19ce9))
- test(web): add test for not-found page ([8c918b8](https://github.com/sbozh-me/website/commit/8c918b8892182ca87f3c3c9dc3a38a12803d03ea))
- test: exclude legal pages from coverage and update release coverage calculation ([ca5da48](https://github.com/sbozh-me/website/commit/ca5da48dd896dfc4d9fb192905dc5314dff6afee))


## [1.1.5] - 2025-12-29

### Changes

- feat(monitoring): add Umami database and data to backup script ([a26ff32](https://github.com/sbozh-me/website/commit/a26ff32dd93cc2bbda9ccfe7068762551e85133a))
- feat(web): implement version-aware sitemap with automated maintenance ([0c54e89](https://github.com/sbozh-me/website/commit/0c54e89d1bf29774161d5f8891f8378357b0090f))
- feat(seo): track blog post updates in sitemap with lastModified dates ([b1fd1a1](https://github.com/sbozh-me/website/commit/b1fd1a1974b33fe2ddd762576472e2c4750dad24))
- feat(cms): add date_updated field to posts schema ([da78808](https://github.com/sbozh-me/website/commit/da78808a8e3308cd4b8cc97611c15d604f31114f))
- feat(deploy): auto-update WEB_IMAGE_TAG from package.json ([d123204](https://github.com/sbozh-me/website/commit/d12320490f046a6d1fc49be8a88f3b49e85b8f61))
- docs(roadmap): mark sitemap milestone complete and renumber subscriptions ([306b4fa](https://github.com/sbozh-me/website/commit/306b4fa774e88aba53b83d2d83ae5fd6372e5952))


## [1.1.4] - 2025-12-23

### Changes

- docs(roadmap): adjust subscriptions timeline to Q1 2026 ([3e09207](https://github.com/sbozh-me/website/commit/3e09207710fdce95edd8e6ba10af5b21146dda73))
- feat(discord): add community rules tab and update version to 0.3.3 ([31f278a](https://github.com/sbozh-me/website/commit/31f278a628d532272393489169b5a37c689b5bc0))


## [1.1.3] - 2025-12-23

### Changes

- docs(seo): add sitemap improvement ideas ([27b05fd](https://github.com/sbozh-me/website/commit/27b05fdf32584590bf314eb2578a8a5217dca1d8))
- build(deps): update next to 15.5.9 ([7f5379f](https://github.com/sbozh-me/website/commit/7f5379f3f58622cda3ef006ee3f6bd0735ee3cea))


## [1.1.2] - 2025-12-23

### Changes

- feat(blog): open external links in new tab with security attributes ([2b2f3d3](https://github.com/sbozh-me/website/commit/2b2f3d389f6926520a442c91a33dd79157ebba15))


## [1.1.1] - 2025-12-22

### Changes

- perf(web): disable source maps to reduce build memory usage ([6ef2102](https://github.com/sbozh-me/website/commit/6ef2102854fbc78fc9e90de745cf4d2fb87c6d63))


## [1.1.0] - 2025-12-22

### Changes

- docs(analytics): add umami pg13 journeys postmortem ([005cfac](https://github.com/sbozh-me/website/commit/005cfac2684b564148fe6c96b39b5f8f0fb9be13))
- docs(analytics): add umami pg13 journeys postmortem github issue ([644c51d](https://github.com/sbozh-me/website/commit/644c51d4ba48e911a5c027ea4b9f2a893a13904b))
- feat(scripts): add git time estimation script ([c41b00e](https://github.com/sbozh-me/website/commit/c41b00efb1adee34d56703ede86498b0185497ce))
- feat(infra): add GlitchTip error tracking infrastructure ([ff8c602](https://github.com/sbozh-me/website/commit/ff8c602b267c34b88c633123bc3853ea977437ca))
- refactor: rename errorTracker to errors and move postmortem ([0766a21](https://github.com/sbozh-me/website/commit/0766a21a0259c0a7db461c9897b522057683e16a))
- refactor(deploy): reorganize production into website and errors dirs ([b9dccf6](https://github.com/sbozh-me/website/commit/b9dccf610bb6ec95612ef69e3cb1b48f7b8450ac))
- refactor(deploy): rename errors to monitoring ([04aab86](https://github.com/sbozh-me/website/commit/04aab86bdf48d77b6e53cf9f781c00e28f95f8e5))
- chore(deploy): remove obsolete umami init and deploy scripts ([8546bd9](https://github.com/sbozh-me/website/commit/8546bd900aa1f939b0e29b3d5c7db616f0b5aeeb))
- docs(analytics): rewrite README and simplify env config ([a0022fc](https://github.com/sbozh-me/website/commit/a0022fc0a13ce6171899972cfe44bca2b0e1689a))
- docs(deploy): add README for local services ([8f55253](https://github.com/sbozh-me/website/commit/8f55253d815e7b8b9706bc164e70077c8da4482b))
- feat(infra): add GlitchTip monitoring deployment infrastructure ([cbf3891](https://github.com/sbozh-me/website/commit/cbf38915e526b510d19483b145da90249fed43e2))
- feat(web): integrate GlitchTip error tracking with dynamic DSN ([8568eea](https://github.com/sbozh-me/website/commit/8568eea68fe71672114e1951cad4b700e1e6df0a))
- fix(monitoring): resolve Docker networking and service discovery issues ([b0b4dd2](https://github.com/sbozh-me/website/commit/b0b4dd27576fe6aff4acbc9e9e49b1d2051264e2))
- chore(deploy): rename docker-compose.prod.yaml to docker-compose.yaml ([69c9767](https://github.com/sbozh-me/website/commit/69c9767d22dbd12f03086a044ecb60834a00924f))
- fix(monitoring): remove duplicate CORS headers from nginx config ([c8bee79](https://github.com/sbozh-me/website/commit/c8bee79770bd444ea0b02e49ac9eaf2f81694b4f))
- refactor(deploy): restructure infrastructure deployment targets ([2c012e9](https://github.com/sbozh-me/website/commit/2c012e9513c2b06cb0292ce6a272e741750a6c47))
- docs(web): update privacy policy for GlitchTip error monitoring ([1618685](https://github.com/sbozh-me/website/commit/16186852316d78f11b4df144f6a200dca3c6062e))
- docs: add GlitchTip monitoring service to READMEs ([3a93538](https://github.com/sbozh-me/website/commit/3a93538ce122106a211ecbaad1db537062500363))
- feat(web): enable source map generation for GlitchTip error tracking ([eff23bb](https://github.com/sbozh-me/website/commit/eff23bbbfe52ff9e584449669a0f9a3b50bc008b))
- docs: update roadmap and backlog with monitoring tasks ([997b621](https://github.com/sbozh-me/website/commit/997b621e46fad93d9cc1ba4ff543a2536aea0baf))
- test(cv): update PDF filename expectation in route test ([0d196da](https://github.com/sbozh-me/website/commit/0d196daa5ac26507759b1a4dc544bdd1b1413199))
- test(web): remove global-error test file ([502d329](https://github.com/sbozh-me/website/commit/502d329bd20b7195958c121da56302ccd6a426c4))


## [1.0.8] - 2025-12-20

### Changes

- fix(analytics): separate Umami into dedicated PostgreSQL 15 database ([60cdfb8](https://github.com/sbozh-me/website/commit/60cdfb86e298d9d9d10f7d871572ad4d041e067e))


## [1.0.7] - 2025-12-20

### Changes

- build(analytics): pin umami version to v3.0.3 correctly ([309e4d6](https://github.com/sbozh-me/website/commit/309e4d603ffe57a62dd42be3d6662961cc7d81fb))


## [1.0.6] - 2025-12-18

### Changes

- build(analytics): pin umami version to v3.0.3 ([3460ec4](https://github.com/sbozh-me/website/commit/3460ec4032ed84644cbc94f84207941abbf2ffb4))


## [1.0.5] - 2025-12-17

### Changes

- feat(ui): add tooltip to Spark component on homepage ([55c6702](https://github.com/sbozh-me/website/commit/55c67020c94566af8c16ff52957c6f8b600f8fc8))


## [1.0.4] - 2025-12-16

### Changes

- fix(ui): add cursor pointer to timeline clickable items ([99a7698](https://github.com/sbozh-me/website/commit/99a76988cb797d1f1daadb5a6d5369306c82af35))


## [1.0.3] - 2025-12-16

### Changes

- fix(ui): hide cookie button in print mode ([8b03a19](https://github.com/sbozh-me/website/commit/8b03a19f70de973f4975ca42e105a2d448008c51))


## [1.0.2] - 2025-12-16

### Changes

- fix(cv): update download button filename ([320c887](https://github.com/sbozh-me/website/commit/320c887500678ca33021eb94ca71a258570087b1))


## [1.0.1] - 2025-12-16

### Changes

- fix(cv): update PDF download filename ([ad97017](https://github.com/sbozh-me/website/commit/ad97017b62fb4f25d38644e79139a436725bcc0d))


## [1.0.0] - 2025-12-16

### Changes

- docs: update version to 1.0.0 and finalize roadmap ([7ab4951](https://github.com/sbozh-me/website/commit/7ab495170940087cb92239fe5433cac6554f4ee4))


## [0.12.0] - 2025-12-16

### Changes

- docs: update documentation for v0.11.9 features and deployment ([dc72954](https://github.com/sbozh-me/website/commit/dc729542298bd1102a329f78bc76d89907ba0034))
- docs(roadmap): enhance subscriptions section and add future milestones ([30a0420](https://github.com/sbozh-me/website/commit/30a04209c1ae4ad6cdf0a4f0584104be560dea78))
- docs(roadmap): mark 0.11.0 deployment and 0.12.0 release candidate as complete ([477cfe9](https://github.com/sbozh-me/website/commit/477cfe97ab02299d57039413001ca8f291d7a7e4))
- test(cv): change cv file name ([79a374b](https://github.com/sbozh-me/website/commit/79a374bc44b3b138c1299faf1f08980f89e6a786))


## [0.11.9] - 2025-12-16

### Changes

- feat(web): add LinkedIn profile URL ([8abae61](https://github.com/sbozh-me/website/commit/8abae61a70d9cc6742097927eba79b274abace07))
- fix(cv): eliminate empty space below scaled CV on mobile ([14c774e](https://github.com/sbozh-me/website/commit/14c774e5eb91cc5b2cc11e5baf0f0cb3cbf5fc93))
- fix(ui): center cookie settings button on mobile ([174d1c9](https://github.com/sbozh-me/website/commit/174d1c90095965587e0edbb9ce266ba22dbf5209))
- fix(ui): scroll to expanded timeline item on click ([2dc2064](https://github.com/sbozh-me/website/commit/2dc2064b596e41324c8a915330482fcd5855e055))
- docs(roadmap): mark 0.11.9 cosmetic changes as complete ([992119b](https://github.com/sbozh-me/website/commit/992119b72a4ff0f9596a014c172baad8317019ca))


## [0.11.8] - 2025-12-16

### Changes

- fix(web): replace corrupted Space Grotesk font with valid TTF ([0fcf69c](https://github.com/sbozh-me/website/commit/0fcf69c8e4ef5a03499d374e31d6d52dfec07142))
- refactor(ci): replace GitHub Actions with local Makefile deployment ([33f6d22](https://github.com/sbozh-me/website/commit/33f6d22b5de3269ffcb7ce36dfe186e61fe95d49))
- build(deploy): use docker buildx for multi-platform support ([c620817](https://github.com/sbozh-me/website/commit/c6208174bc7aacbcbc53627fc7968d1881dc97fe))
- chore: add dockerignore and improve build configuration ([111ca94](https://github.com/sbozh-me/website/commit/111ca941b0cf09cc50b39d0eb957a79056fad45f))
- build(docker): include CHANGELOG, ROADMAP, and BACKLOGIDEAS in Docker images ([5bb7e87](https://github.com/sbozh-me/website/commit/5bb7e87bdce0f455e8bcbdb51984f94f772e1650))
- refactor(og): simplify open graph image layout and styling ([7117b0c](https://github.com/sbozh-me/website/commit/7117b0ce334eace5171f6f8658c57408f395e750))
- fix(og): load images from filesystem instead of self-fetch ([f17ac6a](https://github.com/sbozh-me/website/commit/f17ac6a2cd478e6789acf9a4a0accdd494beeb50))
- refactor(pdf): simplify Chrome setup using puppeteer with bundled Chrome ([e752c4e](https://github.com/sbozh-me/website/commit/e752c4e9e8158c971573461d29f7e54eb96d097e))
- chore(cv): update PDF filename format ([6cdcf89](https://github.com/sbozh-me/website/commit/6cdcf89f63f710a1146fcd9ffbc5d2f1e58d8ced))
- refactor(deploy): decompose Makefile deploy targets ([8ef3ccf](https://github.com/sbozh-me/website/commit/8ef3ccfd78048ec6c7d8fc97f4a7432a43f56bcb))
- feat(deploy): add Umami database initialization to docker-init ([3e5b1a6](https://github.com/sbozh-me/website/commit/3e5b1a6cd97b90d0d31f48fdf9ca53269501377e))
- docs(deploy): add Umami 502 postmortem ([84a8862](https://github.com/sbozh-me/website/commit/84a886218fe2b44551d4bfeeea8c1cee541b28ba))
- fix(scripts): correct docker-compose filename and default server ([caf3602](https://github.com/sbozh-me/website/commit/caf3602a4aaf7bbf5615bbaf0dcd24857b578822))
- docs(deploy): fix dateUmami 502 postmortem ([0420d8a](https://github.com/sbozh-me/website/commit/0420d8a424fb14b58395bdcd0b738ccd8bdf018e))
- fix(nginx): remove duplicate CORS headers from Umami endpoint ([672a001](https://github.com/sbozh-me/website/commit/672a001c56e66d7605fa5a6617d672050150c1a9))
- docs(roadmap): update deployment progress and simplify release milestones ([5588cc6](https://github.com/sbozh-me/website/commit/5588cc6faa0cbac5a69344a9230ed775f4cc530f))


## [0.11.7] - 2025-12-15

### Changes

- ci(docker): build only on version tags, not on main branch ([8794fc2](https://github.com/sbozh-me/website/commit/8794fc28d9b14e4330b1cde8de999d9c02770b7b))
- feat(deploy): add automated Directus schema initialization ([26ba387](https://github.com/sbozh-me/website/commit/26ba3874c6afe2185a52b80d1b69ee307d428c28))
- fix(deploy): use dynamic container discovery in init script ([49fa981](https://github.com/sbozh-me/website/commit/49fa9815499625fc2b321f3c9a03a2a669b217d9))
- fix(deploy): add DIRECTUS_TOKEN to web service for blog data fetching ([d0cb969](https://github.com/sbozh-me/website/commit/d0cb969f68a4df75ecbe27e36b4116f2630c18a9))
- fix(og): fetch TTF fonts instead of WOFF2 for image generation ([d677c6e](https://github.com/sbozh-me/website/commit/d677c6e8d0066ca28dcfab14f481ca8a220ab3b8))
- chore(deploy): update production to v0.11.7 and roadmap milestone ([ce49289](https://github.com/sbozh-me/website/commit/ce492894f207c5e1ceb2596858bb492ab4d315fc))


## [0.11.6] - 2025-12-15

### Changes

- feat(deploy): implement production backup and restore system ([a132016](https://github.com/sbozh-me/website/commit/a13201676576183b0c1a8956ebd769613de733e9))
- chore: mark 0.11.6 complete, add 0.11.7 placeholder ([e28f84b](https://github.com/sbozh-me/website/commit/e28f84b25087df0192a58486da5a5a0438328766))


## [0.11.5] - 2025-12-15

### Changes

- refactor(web): migrate analytics to runtime configuration ([7b19844](https://github.com/sbozh-me/website/commit/7b198441f4e8e55a0717d60951533486dce95096))
- chore: mark 0.11.4-0.11.5 complete, remove 0.11.7 ([92c4990](https://github.com/sbozh-me/website/commit/92c4990e953c375097cc50cfffce4fb879123ff9))


## [0.11.4] - 2025-12-15

### Changes

- feat(deploy): implement wildcard SSL and multi-domain nginx configuration ([000f41d](https://github.com/sbozh-me/website/commit/000f41d316f6c45968d7654dc05471a9b613ab8c))


## [0.11.3] - 2025-12-15

### Changes

- docs(roadmap): mark 0.11.2 as complete ([0b06acf](https://github.com/sbozh-me/website/commit/0b06acfdf919f451a626da77d8f6655a0ca164ef))
- feat(deploy): integrate Umami analytics with production stack ([3822aa6](https://github.com/sbozh-me/website/commit/3822aa6e15c7d992bf819cc18faebb7b9adf0901))


## [0.11.2] - 2025-12-15

### Changes

- feat(deploy): implement GitOps deployment workflow ([a0ce08d](https://github.com/sbozh-me/website/commit/a0ce08d65796e512714aef7ba05d04941c6bcd4f))


## [0.11.1] - 2025-12-15

### Changes

- feat(deploy)!: implement containerization with CI/CD pipeline ([a184b36](https://github.com/sbozh-me/website/commit/a184b36bc40d2d5d45e34e9b0c9506952359fd0a))
- docs(roadmap): mark 0.11.0 and 0.11.1 as complete ([62f7435](https://github.com/sbozh-me/website/commit/62f74356a65e28fac4565e0f7d20758b8cfd3e51))


## [0.11.0] - 2025-12-15

### Changes

- docs(roadmap): add 0.11.x deployment roadmap ([50b4bc6](https://github.com/sbozh-me/website/commit/50b4bc6b59a6587e9130a9c0204b2d00926dfe63))
- feat(deploy): add Hetzner production infrastructure ([ef6022d](https://github.com/sbozh-me/website/commit/ef6022d69801ee8f13262d635ff519cb01e30230))
- docs(roadmap): clarify GitOps deploy trigger ([a328de6](https://github.com/sbozh-me/website/commit/a328de699503e4a5126b92ccc8c2aeba55336145))
- fix(terraform): rename ludus-crm references to sbozh-me ([399b05e](https://github.com/sbozh-me/website/commit/399b05e88b1d9bba89d82beb0460c730619ab86d))


## [0.10.3] - 2025-12-15

### Changes

- feat(footer): add active link highlighting and contact link ([d5a2f03](https://github.com/sbozh-me/website/commit/d5a2f030bec48ef6efbecee26c968865646e06da))
- style(blog): improve mobile responsiveness ([3313cdb](https://github.com/sbozh-me/website/commit/3313cdba4a3b1560d6b028e72c081a5b4f29691a))
- style(ui): improve responsive spacing and focus accessibility ([2adcb34](https://github.com/sbozh-me/website/commit/2adcb343c444d12d86b7b20a2c95d165522da736))
- docs(roadmap): fix version number for cosmetic fixes task ([32d7525](https://github.com/sbozh-me/website/commit/32d7525d8e866d75e4a745aa1789bd6c7782098c))
- feat(projects): reposition status badge in project header ([ff9b5dd](https://github.com/sbozh-me/website/commit/ff9b5dd20898fc8e27d569882c2f8885669c90fc))
- feat(projects): add mobile project links to layout ([3e7c819](https://github.com/sbozh-me/website/commit/3e7c819e305e5517e8e500c54fa5d2aa829bc777))
- style(button): update ghost variant hover styles ([e9f7928](https://github.com/sbozh-me/website/commit/e9f79285703fc6e69ab71fdecee1105913cc3edd))
- feat(web): open Discord invite link in new tab ([4bcff9c](https://github.com/sbozh-me/website/commit/4bcff9ce94fc6cd3ffc6af363ce2b809f1d0b84d))
- fix(ui): correct focus-visible selector syntax ([575198c](https://github.com/sbozh-me/website/commit/575198ca276c444f12977f8f23fe56cf1685149c))


## [0.10.2] - 2025-12-15

### Changes

- feat(legal): update privacy controls to match modal styling ([bcd048d](https://github.com/sbozh-me/website/commit/bcd048d3a5127515bdd2f0f530e4e79df9adc9b9))


## [0.10.1] - 2025-12-15

### Changes

- feat(legal): add Terms of Use page with header and prose styling ([d67e519](https://github.com/sbozh-me/website/commit/d67e519b34caed1df9eb02d54f3d2d9a80d716ef))
- docs(legal): postpone error tracking sections in privacy and terms ([1d5d677](https://github.com/sbozh-me/website/commit/1d5d677cbf4b362a59f850a22a39de961b21b271))


## [0.10.0] - 2025-12-15

### Changes

- docs(roadmap): add v0.10.x legal milestones ([0e0da55](https://github.com/sbozh-me/website/commit/0e0da554f26c5bf0ba9b831b2aa358de4c2d488f))
- fix: resolve type errors in ProjectLinks and performance tracking ([5ad5f33](https://github.com/sbozh-me/website/commit/5ad5f3354dcc0fbe151785b2edccf546c8bdff1e))
- feat(ui): add Dialog component from shadcn ([3a5752d](https://github.com/sbozh-me/website/commit/3a5752d06771216a736429eefca0dcce9d005459))
- feat(legal): add cookie consent modal with toast notifications ([c7e2932](https://github.com/sbozh-me/website/commit/c7e2932f8bbdf2f183d5e904ca97dfc7fe7dc8e2))
- docs: mark 0.10.0 cookie consent modal as complete ([9eba383](https://github.com/sbozh-me/website/commit/9eba3830ff50dbabc279e4c509200c516591710d))
- feat(ui): add soft bottom slide animation to Dialog ([eb486af](https://github.com/sbozh-me/website/commit/eb486afa3504a68f54191bd01afa4dc79267b38f))
- fix(legal): hide cookie button when dialog is open ([c1896fc](https://github.com/sbozh-me/website/commit/c1896fc63c2de70467d804227743cec8991c4aa4))
- chore(test): exclude test-analytics from coverage ([0c22dd4](https://github.com/sbozh-me/website/commit/0c22dd4769bcfdf7b811afb432393dcb28c26bb2))


## [0.9.2] - 2025-12-15

### Changes

- docs(roadmap): restructure analytics roadmap by consolidating phases ([f0e5723](https://github.com/sbozh-me/website/commit/f0e5723e1bee696da13b7805260d27666043a981))
- docs(roadmap): fix version numbers in analytics roadmap files ([adc8e63](https://github.com/sbozh-me/website/commit/adc8e63d0d68d6d41877721a10682fba1fdcb79e))
- feat(analytics)!: implement advanced tracking, Core Web Vitals, and comprehensive privacy controls ([cb9f92a](https://github.com/sbozh-me/website/commit/cb9f92a99227f5cd401efb18f78b555f3516add7))
- feat(analytics): add external link tracking and test page ([3a66a92](https://github.com/sbozh-me/website/commit/3a66a920d8e7a6728080d7bb5e60b39eb2f889f8))
- test(web): add comprehensive unit tests for analytics and privacy ([b3cacb6](https://github.com/sbozh-me/website/commit/b3cacb69040cf7ce496f7cfda0f63f541170fa95))
- docs(analytics): add deployment documentation and guides ([3679e9b](https://github.com/sbozh-me/website/commit/3679e9b58cae1014ace066cb66bd56ee9eb8926a))
- docs(privacy): enhance privacy policy with detailed information ([ff40884](https://github.com/sbozh-me/website/commit/ff40884f7846471b433772a90e6cf34803ab1eb4))
- docs(roadmap): update v0.9.3 deliverables status ([2ee5388](https://github.com/sbozh-me/website/commit/2ee5388c87afa5b867146e904c9445ff0ad46537))
- docs(roadmap): mark v0.9.x analytics milestones as complete ([8006847](https://github.com/sbozh-me/website/commit/80068479501e204309fd6dac290f241a6b423e45))


## [0.9.1] - 2025-12-14

### Changes

- feat(analytics): integrate Umami Analytics for privacy-focused web tracking ([eab84a5](https://github.com/sbozh-me/website/commit/eab84a53e581a38fbfb5fc8273757b2c0bfdfe3b))


## [0.9.0] - 2025-12-14

### Changes

- docs: update README files with v0.8.5 features and project status ([89e7bfb](https://github.com/sbozh-me/website/commit/89e7bfb59b961cf3a6ec62e7f8e5c1ad35f89983))
- content(projects): mark discord community roadmap milestones as completed ([e86ae30](https://github.com/sbozh-me/website/commit/e86ae30a982bfd58bde97e102a32e5f50ee883c9))
- feat(analytics): add v0.9.0-0.9.5 roadmap and infrastructure planning ([45cb685](https://github.com/sbozh-me/website/commit/45cb6856050eb225c3d95c66e8c9c4b838f0ef72))
- docs(roadmap): expand 0.9.0 analytics section with sub-version links ([614aa84](https://github.com/sbozh-me/website/commit/614aa841df7a8fc945675c9fb7109900145681e8))
- docs(roadmap): add note about cookie choice control for page view tracking ([dea7af6](https://github.com/sbozh-me/website/commit/dea7af6d43fb1c0f609cb33dfe918354913c904f))
- feat(analytics): implement v0.9.0 infrastructure with Docker Compose ([93d00c3](https://github.com/sbozh-me/website/commit/93d00c3559886a336e8d8ec53b6fe8560212b6ca))
- docs(roadmap): correct analytics deployment version to 0.11.0 ([d512790](https://github.com/sbozh-me/website/commit/d512790fec7239c77109003476f50d88348947a1))
- test(web): add comprehensive test coverage for page components ([4b77d03](https://github.com/sbozh-me/website/commit/4b77d03b2c4f55142090c707aa259956b1d79c34))


## [0.8.5] - 2025-12-14

### Changes

- feat(projects): complete 0.8.5 milestone with accessibility, testing, and polish ([0054421](https://github.com/sbozh-me/website/commit/005442127114ec8a34ca46c8389c0c63bf09e440))


## [0.8.4] - 2025-12-14

### Changes

- style(projects): improve card layout and support multiline taglines ([8cc345f](https://github.com/sbozh-me/website/commit/8cc345f04e5e2f4bf96911c89b67f630d868e023))
- feat(projects): add Discord community content and routing ([88a64ab](https://github.com/sbozh-me/website/commit/88a64ab4da1c52d18e7285f3b3d144bf9b32fa42))
- feat(projects): add roadmap tab to discord community project ([df277d9](https://github.com/sbozh-me/website/commit/df277d9e4cb9db973c21ba2c963d29b0bb31c3e6))
- feat(projects): add Discord invite link and refactor ProjectLinks component ([3b8acf3](https://github.com/sbozh-me/website/commit/3b8acf3a3f995c9b33d1a615040813c05ab670ff))


## [0.8.3] - 2025-12-14

### Changes

- feat(projects): add dynamic MDX content, breadcrumbs, contact page, and routing improvements ([738736c](https://github.com/sbozh-me/website/commit/738736c1ea1fe6894009dc0368c464ae1c00e368))
- content(projects): add motivation tab content for sbozh-me ([a379084](https://github.com/sbozh-me/website/commit/a3790843d55c3fd318d037622e6af6c28557c0a2))
- style(projects): improve mobile tab navigation visibility and touch targets ([5874479](https://github.com/sbozh-me/website/commit/58744795af9b7528872ee2c8576c5b6fb69f1b84))
- style(projects): improve hero tagline readability with text shadow ([9782f8f](https://github.com/sbozh-me/website/commit/9782f8f9e0ee3331fee434fe9b77f487be0c6ef6))
- feat(projects): add data-driven links sidebar ([10fb7de](https://github.com/sbozh-me/website/commit/10fb7deab123910a8351ea6ffb38643463fea80e))
- feat(projects): add changelog timeline with version grouping and GitHub integration ([9256e91](https://github.com/sbozh-me/website/commit/9256e91fdee33c9f327b26c2ae1fd9a844fafbd1))
- chore(web): add MIT license to package.json ([ee4196d](https://github.com/sbozh-me/website/commit/ee4196d7a17d7b4c4bb4a21cd87fd9fcd6a5b530))
- feat(projects): display version in hero and footer ([2b8e145](https://github.com/sbozh-me/website/commit/2b8e145b7754184e5d418d467a4991adb83537d6))
- feat(projects): add version to project cards and read from package.json ([93de3e2](https://github.com/sbozh-me/website/commit/93de3e2f370e8163e921f4745da12f404c4a96c6))
- feat(projects): add roadmap feature with unified timeline component ([b057bfc](https://github.com/sbozh-me/website/commit/b057bfc66fe5db6cc0bdc1307b42fff3dd118ae4))
- fix(react-ui): center timeline dots on vertical line ([f9b718c](https://github.com/sbozh-me/website/commit/f9b718c20cc9a226022d04fed67618d824c0ec80))
- feat(projects): improve roadmap UI with tick icons and plain text links ([f5fb48d](https://github.com/sbozh-me/website/commit/f5fb48d949815ed9026ad89449f4318979533d9c))
- feat(projects): auto-expand roadmap section matching current version ([8bd114a](https://github.com/sbozh-me/website/commit/8bd114a9dae94d8b8f7d2696169c44c04b61de53))
- style(projects): improve mobile hero and tab navigation layout ([3c6994e](https://github.com/sbozh-me/website/commit/3c6994e6ccd40d1fc56d530d6cfc799991d49336))
- content(projects): add intro blockquote to motivation tab ([bf6dea7](https://github.com/sbozh-me/website/commit/bf6dea70fa32a13d32b647259aedb0ac1a8e58ea))
- style(projects): fix h2 heading size on changelog and roadmap tabs ([aa2f4f3](https://github.com/sbozh-me/website/commit/aa2f4f3e9b503821a9e8c2ccbe167276d193ffcf))
- content(projects): simplify motivation tab intro ([65a13c7](https://github.com/sbozh-me/website/commit/65a13c7acd3d44e89e74214388cd4800e796ef15))


## [0.8.2] - 2025-12-14

### Changes

- feat(projects): implement dynamic project detail pages with tab navigation ([5b2197b](https://github.com/sbozh-me/website/commit/5b2197b1fceae6903543892d3a8e4fd69fdc3028))
- feat(projects): add hero image position option for object-fit control ([50f2765](https://github.com/sbozh-me/website/commit/50f276583c11a1413a22eab889ffa8051fcc60d0))


## [0.8.1] - 2025-12-13

### Changes

- feat(seo): add projects SEO metadata, sitemap routes, and OG images ([764a141](https://github.com/sbozh-me/website/commit/764a14163cc2883ddcec221a7612f0c4399a2459))


## [0.8.0] - 2025-12-13

### Changes

- docs: mark 0.7.0 SEO complete and add backlog ideas ([d8648b0](https://github.com/sbozh-me/website/commit/d8648b05abe429c86ba0b5f10a6e21bec607d475))
- chore: remove test:coverage from packages, keep only in web app ([a176e0f](https://github.com/sbozh-me/website/commit/a176e0f781d67de51a456de4e3b579c92009d53e))
- docs(roadmap): expand 0.8.0 into comprehensive projects section roadmap ([92435a7](https://github.com/sbozh-me/website/commit/92435a7cb301ff434855fc99be6e29fddb428aa4))
- feat(projects): implement project listing page with card grid layout ([c788e62](https://github.com/sbozh-me/website/commit/c788e624dba4d7a523521eb3a82bcc7881784838))
- chore(assets): add project hero images ([72525e5](https://github.com/sbozh-me/website/commit/72525e52b90239ebcc55d4a46e7e3c5c34e6cdcd))
- chore(projects): update project descriptions and metadata ([4cc62b9](https://github.com/sbozh-me/website/commit/4cc62b9d26f8cfbd7d4e7d31cfca61e8202a091d))
- test(projects): update tests for project grid implementation ([c5121d7](https://github.com/sbozh-me/website/commit/c5121d76b193d374905fa9cfb399ac9b2c84dd92))


## [0.7.4] - 2025-12-13

### Changes

- feat(seo): add page-level metadata for blog and CV pages ([6fa27b6](https://github.com/sbozh-me/website/commit/6fa27b65086871855eb031a41520cc9e42c1f5c7))
- docs(seo): update site description to build in public tagline ([be0d8fb](https://github.com/sbozh-me/website/commit/be0d8fb94a41d45fa315121d1e67c08ff5c05410))


## [0.7.3] - 2025-12-13

### Changes

- feat(seo): implement dynamic OG image generation for blog posts ([e1636b8](https://github.com/sbozh-me/website/commit/e1636b80a77938a306ddf2b93cfacf5e54b799f1))
- docs(roadmap): mark 0.7.3 OG image generation for deploy testing ([f2fba05](https://github.com/sbozh-me/website/commit/f2fba05224e45ee8d425caf6be7b05a81e90c8ef))


## [0.7.2] - 2025-12-12

### Changes

- feat(seo): implement blog post SEO metadata with Open Graph and Twitter cards ([c0a8692](https://github.com/sbozh-me/website/commit/c0a869269c492e6c5b9b1e7d9a3447fa124a0bf9))


## [0.7.1] - 2025-12-12

### Changes

- docs(roadmap): mark 0.6.0 Blog Backend as complete ([95df42d](https://github.com/sbozh-me/website/commit/95df42d019cfcdef888337cb8adabacdafa3d7d6))
- chore(assets): update favicon files ([af3e7f3](https://github.com/sbozh-me/website/commit/af3e7f3297a3cd1453b80b077b368b555b03a9f1))
- feat(blog): add optional TL;DR summaries for blog posts ([7d5f472](https://github.com/sbozh-me/website/commit/7d5f47254a0bb37faf200a8ff566ae85a3de3778))
- feat(seo): implement robots.txt and sitemap.xml generation ([14675d1](https://github.com/sbozh-me/website/commit/14675d1a337e461a1a6133206f169346a59e4cbc))


## [0.7.0] - 2025-12-12

### Changes

- docs(roadmap): add SEO implementation plans and favicon assets ([884a0d3](https://github.com/sbozh-me/website/commit/884a0d36d0a9498960c32f87d6d53ace866b4c21))
- feat(seo): implement base metadata and favicon configuration ([8f679ee](https://github.com/sbozh-me/website/commit/8f679eecd2b0fcd10adc63c1a3ce976a2eaff06f))
- test: remove deferred filter tests and fix mock assertion ([22b94b8](https://github.com/sbozh-me/website/commit/22b94b8738a8e2918c4cf81a1ddf58975db39e84))
- test(blog): add comprehensive test coverage for blog pages ([288a2b8](https://github.com/sbozh-me/website/commit/288a2b846ca4da2c8a07219990b81dd3cb654f4f))


## [0.6.4] - 2025-12-12

### Changes

- docs(roadmap): defer filters to post-second-blog-post ([afea4ae](https://github.com/sbozh-me/website/commit/afea4ae59b086699e57b6ea5e18a75e0a9f5d36f))
- test(blog): add DirectusRepository tests and debug logging ([9fd5ab4](https://github.com/sbozh-me/website/commit/9fd5ab4e963e005ad8f8cf978af433b46be8bc50))


## [0.6.3] - 2025-12-12

### Changes

- feat(blog): implement environment-based repository factory for Directus integration ([e5fad68](https://github.com/sbozh-me/website/commit/e5fad68c4e4e7d19033f6c15af0cd93ca33ff673))
- feat(blog): add error handling for Directus API failures ([2d14c85](https://github.com/sbozh-me/website/commit/2d14c854023c68790eefc85a64e789fab7d50a75))
- docs(blog): add error handling sections to READMEs ([59f4cb0](https://github.com/sbozh-me/website/commit/59f4cb0bd821c5041612eb50b1ccbcdf92d495bf))
- feat(blog): add image foreign key relation to posts schema ([7dab737](https://github.com/sbozh-me/website/commit/7dab7375dbf209aad202ebc2c21fa76f014bf726))
- fix(blog): disable caching for real-time content updates ([8c201be](https://github.com/sbozh-me/website/commit/8c201be6fbc8485d81c51a1820f6881704a5821f))
- feat(blog): add Next.js API proxy for Directus assets ([196cf48](https://github.com/sbozh-me/website/commit/196cf48d4b2635cf2f5efa8c67d4598db9dde490))
- style(blog): update prose CSS variables and link hover effects ([bca69f9](https://github.com/sbozh-me/website/commit/bca69f9ef61ef75985cb051916446592f01bdd81))
- feat(blog): add attribution field for content source crediting ([3eba1df](https://github.com/sbozh-me/website/commit/3eba1df03172f76c73d8ac8fbcd4a7d3d61613c7))
- feat(directus): skip seeding if posts already exist ([9e6b419](https://github.com/sbozh-me/website/commit/9e6b419e11bf72218434363bb985f0a71a9d6b8b))


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
