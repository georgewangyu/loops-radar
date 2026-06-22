# Loops Radar Site Build Progress

## Objective

Turn the accepted Loops Radar frontend prototype into a Vercel-deployable site
with an initial catalog of GeorgeLoops content, public/private issue submission
routing, and live UI verification across core
catalog and form workflows.

## Starting Architecture

- The repo is a dependency-free static prototype with one `index.html` file and
  saved screenshots.
- The accepted design direction is the "Codex Index" catalog: sticky topbar,
  searchable list, collection rail, selected detail preview, and bottom
  contribution form.
- Submission behavior is visual only; no API route exists yet.
- No package manifest, build command, tests, or Vercel-ready framework exists.

## Target Architecture

- Next.js app deployable on Vercel.
- Catalog data lives in repo-owned source files so the site does not depend on
  local sibling repositories at runtime.
- UI state is client-side: search, category/status filters, selected loop, copy
  behavior, and form submission states.
- Issue creation is server-side only, with GitHub token and target repos read
  from environment variables.
- Public submissions are the default while private review remains available.
- UI verification includes build checks plus browser interaction and responsive
  screenshots.

## Decisions

- Reuse a server-side GitHub issue pattern instead of exposing
  tokens client-side.
- Keep the SnackVoice/Loops Radar design language: warm surfaces, restrained
  accent, compact metadata, soft borders, and catalog-first layout.
- Use a plain Next app before adding heavier component libraries; the accepted
  direction is already custom and simple.

## Verification Log

- `npm install`: installed Next/React/Zod/TypeScript dependencies with no
  reported vulnerabilities.
- `npm run build`: passed. Routes generated:
  - `/` static
  - `/api/submit` dynamic server route
- `npm run typecheck`: passed after `.next` generation completed.
- Browser UI verification against `http://127.0.0.1:4189/` passed:
  - page title and hero visible
  - initial catalog count: 11 loops
  - search for `thumbnail` returns `Thumbnail Iteration Loop`
  - `Goal recipe` filter returns `Refactor Until Architecture Settles`
  - selected loop detail updates after clicking a loop
  - submission form success state renders with mocked `/api/submit`
  - submit payload defaults to `visibility: public`
  - submit payload defaults to `submissionType: submit-loop`
  - desktop viewport has no horizontal overflow
  - mobile viewport has no horizontal overflow
  - mobile submit link is reachable
  - no browser console errors
- Direct API validation check passed: invalid payload returns HTTP 400 with
  structured field errors and does not touch GitHub.
- After cleanup, a live mobile smoke check passed:
  - title: `Loops Radar`
  - initial count visible
  - search for `refactor` reveals `Refactor Until Architecture Settles`
  - mobile viewport has no horizontal overflow
- Local workflow note: running `next build` while `next dev` is active can leave
  the dev server with stale `.next` module references. Stop dev or restart it
  after production builds during local verification.
- Copy action verification passed: the first loop's `Copy` button changes to
  `Copied`, and the clipboard text includes the loop heading plus verifier
  section.
- Follow-up UI correction: the accepted direction is the shadcn-style product
  catalog, not the Codex Index layout. Refactored the home page to a sidebar +
  central list + right detail panel layout.
- Added real loop detail pages at `/loops/[id]`, generated from the catalog
  data. Row clicks now navigate to the full loop page instead of only updating
  an in-page hash/preview.
- Added a durable Playwright suite in `tests/loops-radar.spec.ts` with
  `npm run test:ui`. Production verification now covers:
  - catalog search and filters
  - preview buttons updating the side panel
  - row link navigation to `/loops/weekly-agent-loop-scan`
  - every generated loop detail page rendering Inputs, Workflow, Outputs, and
    Verifier sections
  - detail page navigation back to catalog and submit form
  - copy-to-clipboard behavior
  - mocked issue submission with `visibility: public`
  - mobile horizontal overflow
- Full verification command passed after the detail-page fix:
  `npm run build && npm run typecheck && npm run test:ui`.
  Result: 32 Playwright tests passed across desktop and mobile.
- Live dev verification on `http://127.0.0.1:4189/` passed for the exact missed
  flow: clicking the `Weekly Agent Loop Scan` row navigates to
  `/loops/weekly-agent-loop-scan` and shows the loop page with its Workflow
  section.

Screenshots and the UI verification receipt are under `output/playwright/`.

## Remaining Risks

- Exact GitHub public/private repo names must be configured in Vercel
  environment variables.
- Live GitHub issue creation should not be exercised locally unless a safe test
  repo/token is intentionally provided.
- The first catalog is a curated snapshot of GeorgeLoops content. A future pass
  can add a small import/generation script if GeorgeLoops becomes the canonical
  upstream source for this public site.
