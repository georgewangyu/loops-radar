# Loops Radar

A Vercel-deployable catalog of reusable agent, research, content, coding, and
operations loops.

Live site: https://loops-radar.vercel.app

The current site starts with GeorgeLoops and selected public agent-skill repos,
then uses the accepted catalog-first design:

- searchable loop index
- category and status filters
- selected loop detail section
- copyable source markdown from the public source repos
- bottom contribution form
- public issue submission by default
- private review issue route when selected

## Source Sync

Loops Radar treats public markdown repos as source material. The source list is
tracked in `sources/loop-repos.md` for humans and `sources/loop-repos.json` for
automation.

```sh
npm run sync:loops
```

The sync command reads `LOOP.md`, `GOAL.md`, and selected `SKILL.md` files from
the configured repos, regenerates `lib/loops.ts`, and keeps each detail page's
copy block aligned with the exact source markdown. GeorgeLoops keeps stable IDs
for existing public URLs; external repos are prefixed by source to avoid ID
collisions. A weekly GitHub Actions workflow opens a pull request when public
source markdown changes.

The first external pass includes Anthropic Skills, Addy Osmani Agent Skills,
Superpowers, Vercel Agent Skills, PM Skills, Dimillian Skills, Markdown Viewer
Skills, and Last30Days Skill. Broad aggregators and massive catalogs are kept in
the source watchlist until ranking/import rules are stronger.

## Local Development

```sh
npm install
npm run dev -- --port 4189
```

Open `http://localhost:4189`.

## Try The Main Flow

1. Search for a loop by keyword.
2. Filter by category or status.
3. Open a loop detail page.
4. Copy the source markdown.
5. Submit a public issue or private review request from the contribution form.

## Verification

```sh
npm run typecheck
npm run build
npm run test:ui
```

`npm run test:ui` runs the Playwright suite against a production `next start`
server. It covers catalog search/filtering, preview buttons, row click-through
to loop pages, representative generated detail pages across sources,
copy-to-clipboard, mocked issue submission, and mobile overflow.

Playwright traces and reports are ignored by git.

## Vercel

Use the standard Next.js Vercel preset.

Required environment variables:

```sh
GITHUB_TOKEN=<server-side-github-token>
GITHUB_OWNER=your-github-owner
GITHUB_REPO=loops-radar-public
GITHUB_PRIVATE_REPO=loops-radar-private-intake
```

Optional:

```sh
GITHUB_API_VERSION=2022-11-28
LOOPS_REQUEST_ALLOWED_ORIGIN=https://your-domain.example
```

`GITHUB_TOKEN` must stay server-side and needs issue read/write access for the
public and private target repos.
