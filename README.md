# Loops Radar

Find loops worth running.

Loops Radar is a public catalog and digest layer for reusable AI-agent loops:
goal recipes, daily workflows, engineering loops, content loops, operations
loops, and loop-pattern repos. The website lets people search and copy source
markdown. The installed skill lets an agent search the catalog, adapt a loop to
the work ahead, and deliver a daily or weekly digest from the public weekly
feed.

Live site: https://loopsradar.snackoverflowgeorge.com

## What You Get

- Searchable public catalog of reusable loops.
- Copyable source markdown from public source repos.
- Weekly feed of newly added or featured loops.
- Daily rotation pulled from the latest weekly feed.
- Lightweight `Recommended today` outlook with one primary goal, one
  maintenance loop, and one content or research loop.
- Agent skill for selecting, adapting, and summarizing loops.
- Public contribution form, with private review available for rough ideas.

## Quick Start

Pick your agent and run the install command, then ask the agent to set it up.

### OpenClaw

```bash
git clone https://github.com/georgewangyu/loops-radar.git ~/skills/loops-radar
```

```text
set up Loops Radar
```

### Claude Code

```bash
mkdir -p ~/.claude/skills && git clone https://github.com/georgewangyu/loops-radar.git ~/.claude/skills/loops-radar
```

```text
set up Loops Radar
```

### Codex

```bash
mkdir -p ~/.codex/skills && git clone https://github.com/georgewangyu/loops-radar.git ~/.codex/skills/loops-radar
```

Or use the skill installer:

```bash
npx skills add georgewangyu/loops-radar --skill loops-radar -g
```

```text
set up Loops Radar
```

### Cursor / Other Agents

```bash
git clone https://github.com/georgewangyu/loops-radar.git ~/skills/loops-radar
```

```text
Use ~/skills/loops-radar/skills/loops-radar/SKILL.md and set up Loops Radar.
```

The agent walks you through:

- daily, weekly, or on-demand digest schedule
- delivery time and timezone
- language: English, Chinese, or bilingual
- tone: concise, operator, or technical
- delivery: current chat, Telegram, email, or an OpenClaw channel

No source API keys are required from users. The public catalog and feed are
generated centrally. Users only need delivery credentials if they choose
Telegram or email outside OpenClaw.

Node.js 20+ is only needed for scheduled non-OpenClaw Telegram/email delivery
through the included scripts. Chat-only use does not require installing npm
packages.

## Delivery Options

### OpenClaw

OpenClaw can deliver to its configured channels:

- Telegram
- Telegram forum topics
- Feishu
- Discord
- Slack
- WhatsApp
- Signal

The skill creates an `openclaw cron add` job with an explicit `--channel` and
`--to` target.

### Claude Code, Codex, Cursor, or Other Agents

Without OpenClaw or another persistent runtime, automatic delivery is limited
to:

- Telegram through a user-owned Telegram bot
- email through a user-owned Resend API key
- on-demand in the current chat

For scheduled Telegram/email delivery, the skill installs a local `crontab`
entry that sends the latest public markdown feed. For a fully agent-remixed
digest, ask the skill in chat or use a persistent agent runtime.

## Changing Settings

Just tell your agent:

- "Switch to weekly digests on Monday mornings"
- "Switch to daily loop picks"
- "Give me Recommended today"
- "Change language to bilingual"
- "Send this to Telegram instead"
- "Make the digest shorter"
- "Show me my current settings"

Settings are saved locally in `~/.loops-radar/config.json`. Delivery keys, if
used, are saved locally in `~/.loops-radar/.env`.

## Customizing Summaries

The skill uses a plain markdown prompt:

- [summarize-latest-feed.md](prompts/summarize-latest-feed.md)

Ask your agent to make the digest shorter, more technical, more operator-style,
or more action-oriented. It can copy prompts into `~/.loops-radar/prompts/` for
local customization.

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
collisions.

The current source list lives in:

- [sources/loop-repos.md](sources/loop-repos.md)
- [sources/loop-repos.json](sources/loop-repos.json)

Broad aggregators and massive catalogs stay in the source watchlist until
ranking/import rules are strong enough.

## Weekly Feed

The weekly digest feed is generated after source sync:

```sh
npm run feed:weekly
```

Feed files live under:

```text
feeds/YYYY/MM/YYYY-MM-DD.md
```

The feed script compares the current generated catalog with
`memory/seen-loop-ids.json`, highlights newly seen loops first, and then records
the current catalog as the new baseline. If no new loops are found, the feed can
still provide a featured rotation from the existing catalog.

Read the newest feed:

```sh
npm run --silent feed:latest
```

## Daily Outlook

The installed skill supports a compact morning-style recommendation:

```text
Recommended today:

1. Primary goal
   /goal ...
   Why: ...
   Evidence: ...
   Verifier: ...

2. Maintenance loop
   Run: ...
   Why: ...
   Risk: low / medium / high

3. Content or research loop
   Run: ...
   Why now: ...
   Output expected: ...
```

This mode intentionally stays small. It reads the latest weekly feed first,
then adapts the choices to the current work only when the user or local agent
has already placed that context in scope.

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
6. Install the skill and ask for a daily or weekly digest.

## Verification

```sh
npm run feed:weekly
npm run --silent feed:latest
npm run typecheck
npm run build
npm run test:ui
```

`npm run test:ui` runs the Playwright suite against a production `next start`
server. It covers catalog search/filtering, preview buttons, row click-through
to loop pages, representative generated detail pages across sources,
copy-to-clipboard, mocked issue submission, and mobile overflow.

Playwright traces and reports are ignored by git.

## How It Works

1. The weekly automation runs `npm run sync:loops`.
2. If the catalog changes, it verifies, commits, and pushes safe public updates.
3. It runs `npm run feed:weekly` to create the newest public feed.
4. The installed skill reads the latest feed and summarizes it using user
   preferences.
5. The digest is shown in chat or delivered to the configured channel.

## Privacy

- The repo contains only public-safe catalog and feed content.
- User delivery credentials stay local.
- The skill does not ask users for source API keys.
- The skill does not read private George context.

## Vercel

Use the standard Next.js Vercel preset.

Required environment variables:

```sh
GITHUB_TOKEN=<server-side-github-token>
GITHUB_OWNER=your-github-owner
GITHUB_REPO=loops-radar
GITHUB_PRIVATE_REPO=<private-intake-repo>
```

Public submissions create issues in `GITHUB_OWNER/GITHUB_REPO`. Private
submissions create issues in `GITHUB_OWNER/GITHUB_PRIVATE_REPO`; this must be an
existing private repo with Issues enabled and token access configured.

Optional:

```sh
GITHUB_API_VERSION=2022-11-28
LOOPS_REQUEST_ALLOWED_ORIGIN=https://your-domain.example
```

`GITHUB_TOKEN` must stay server-side and needs issue read/write access for the
public and private target repos.
