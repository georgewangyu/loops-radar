# Loops Radar

A Vercel-deployable catalog of reusable agent, research, content, coding, and
operations loops.

The current site starts with GeorgeLoops content and uses the accepted
catalog-first design:

- searchable loop index
- category and status filters
- selected loop detail section
- copyable source markdown from the public GeorgeLoops repo
- bottom contribution form
- public issue submission by default
- private review issue route when selected

## GeorgeLoops Sync

Loops Radar treats the public GeorgeLoops markdown as the source of truth.

```sh
npm run sync:georgeloops
```

The sync command reads `loops/*/LOOP.md` and `goals/*/GOAL.md` from
`georgewangyu/GeorgeLoops`, regenerates `lib/loops.ts`, and keeps each detail
page's copy block aligned with the exact source markdown. A weekly GitHub
Actions workflow opens a pull request when the public GeorgeLoops source
changes.

## Local Development

```sh
npm install
npm run dev -- --port 4189
```

Open `http://localhost:4189`.

## Verification

```sh
npm run typecheck
npm run build
npm run test:ui
```

`npm run test:ui` runs the Playwright suite against a production `next start`
server. It covers catalog search/filtering, preview buttons, row click-through
to loop pages, every generated loop detail page, copy-to-clipboard, mocked issue
submission, and mobile overflow.

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
