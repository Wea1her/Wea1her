# Astro-star Theme Migration Design

## Goal

Migrate the current blog from `astro-theme-pure` to the `Wea1her/Astro-star` theme while preserving the user's blog posts, personal content, site identity, assets, and comment setup.

## Current Project

The current site is an Astro 5 project based on `astro-pure`. The user-owned content and configuration are concentrated in:

- `src/content/blog/*.md`
- `src/content/images/*`
- `src/pages/about/index.astro`
- `src/pages/projects/index.astro`
- `src/pages/links/index.astro`
- `src/pages/terms/*`
- `src/site.config.ts`
- `public/avatar.png`
- `public/favicon/*`
- `public/images/social-card.png`
- `public/links.json`

The current blog collection uses `publishDate`, `updatedDate`, `heroImage`, `tags`, `language`, `draft`, `comment`, `encrypted`, and `password`.

## Target Theme

The target theme is `Wea1her/Astro-star`. It is an Astro 6 theme with:

- Dynamic section routes: `/blog/`, `/note/`, `/project/`, and `/<section>/<slug>/`
- Content collections for `blog`, `note`, `project`, and `page`
- Theme configuration in `src/config/site.ts`, `src/config/social.ts`, `src/config/links.ts`, and `src/config/search.ts`
- Visual shell files in `src/components`, `src/layouts`, `src/style`, `src/scripts`, and `src/utils`
- MDX support, KaTeX, sitemap, RSS, Waline comments, and theme scripts

## Migration Approach

Use Astro-star as the new theme architecture and port the user's content into it.

This means replacing the Pure theme layer rather than trying to emulate Astro-star inside Pure. The migrated site should use Astro-star layouts, components, utilities, styles, scripts, routes, and configuration structure. The current user's content remains the source of truth.

## Preserved Content

The migration must preserve:

- All files under `src/content/blog/`
- All files under `src/content/images/`
- Existing public identity assets: avatar, favicon, and social card
- Existing site identity: `Weather Cosmos`, author `Weather`, description, site URL, and language context
- Existing social links: GitHub and Telegram
- Existing Waline server URL and comment/pageview behavior
- Existing top-level content pages where useful: about, projects, links, and terms
- Existing blog metadata including tags, language, draft status, encryption fields, and comments preference

## Content Compatibility

Astro-star reads `createdAt`, `updatedAt`, `image`, `published`, `type`, and `routeSlug` for listing and detail pages. The current posts use Pure-style fields.

The migration should make Astro-star compatible with the current posts by adding resolver support instead of requiring a destructive content rewrite:

- `createdAt` falls back to `publishDate`
- `updatedAt` falls back to `updatedDate`
- `image` falls back to `heroImage.src`
- `published` treats `draft: true` as unpublished
- `type` may use the first tag or `language` only if a post does not provide `type`
- Existing extra frontmatter remains accepted by the content schema

This keeps the Markdown files readable and minimizes content churn.

## Routes

Required routes:

- `/` renders the Astro-star home shell with the user's profile and latest blog posts.
- `/blog/` lists the user's blog posts.
- `/blog/<slug>/` renders existing posts.
- `/about/` renders migrated personal about content.
- `/links/` renders migrated links content and friend links where possible.
- `/project/` renders migrated project entries.
- `/projects/` remains as a compatibility route that redirects or links to `/project/`.
- `/terms/` content remains reachable if the existing legal pages are still present.

## Configuration Mapping

Map current configuration into Astro-star:

- `theme.title` -> `site.site.name`
- `theme.author` -> `site.profile.name`
- `theme.description` -> `site.site.description`, `site.profile.bio`, and the first sentence of `site.profile.intro`
- `theme.logo` and `public/avatar.png` -> `site.profile.avatarSrc`
- `theme.favicon` -> `site.site.iconSrc`
- `theme.footer.social.github` and `theme.footer.social.telegram` -> `socialLinks`
- `integ.waline.server` -> Waline environment fallback or config utility default
- `theme.header.menu` -> `site.site.nav`

Use the existing site URL `https://www.0xweather.com`.

## Implementation Boundaries

Remove the Pure-specific theme dependency and local theme package only when the Astro-star replacement is in place. Avoid unrelated rewrites of blog prose, image assets, or public files.

It is acceptable to replace these theme-owned areas with Astro-star equivalents:

- `src/components`
- `src/layouts`
- `src/style`
- `src/scripts`
- `src/utils`
- `src/pages` route files that are part of the theme shell
- `src/content.config.ts`
- `astro.config.*`
- `package.json`, lockfile, and TypeScript config as needed

It is not acceptable to delete user content directories without first migrating their content:

- `src/content/blog`
- `src/content/images`
- `public/favicon`
- `public/images/social-card.png`
- `public/avatar.png`

## Testing

Verification must include:

- `astro check`
- `astro build`
- A content count check showing that all current blog posts are still present
- Manual route checks for `/`, `/blog/`, one blog detail page, `/about/`, `/links/`, and `/project/` or `/projects/`
- A quick search for unresolved Pure-only imports such as `astro-pure`

## Risks

Astro-star currently targets Astro 6, while the current project targets Astro 5. The migration is expected to update dependencies and may require lockfile regeneration.

Current posts contain Pure-specific MDX components such as `<Steps>`. Astro-star must provide compatible MDX components or the content must be adapted without losing meaning.

The current deployment uses Vercel static output. Astro-star defaults to Node server output in the target repository. The migrated project should prefer the current static deployment model unless a theme feature strictly requires server output.

## Approved Scope

The user selected and approved the full Astro-star theme migration option on 2026-07-01.
