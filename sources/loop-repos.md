# Loop Source Repos

Loops Radar uses this source list the way George Builder Radar uses public
watchlists: the markdown files below are external references that can be synced
into the catalog, searched, opened, and copied as source markdown.

## Active Sync Set

| Source | Repo | Pattern | Why it is included |
| --- | --- | --- | --- |
| GeorgeLoops | `georgewangyu/GeorgeLoops` | `loops/*/LOOP.md`, `goals/*/GOAL.md` | Owned canonical loop and goal recipes. |
| Forward Future Loop Library | `Forward-Future/loop-library` | published `catalog.json` | Loop-native catalog with structured prompts, verification, steps, and source links. |
| Awesome Agent Loops | `serenakeyitan/awesome-agent-loops` | `README.md` command sections | Copyable `/loop`, `/goal`, and `/schedule` prompts split into individual loop cards. |
| ChaoYue Awesome Loop Engineering | `ChaoYue0307/awesome-loop-engineering` | `examples/*-loop.json`, runnable loop markdown | Loop contracts and runnable examples for recurring AI-agent workflows. |
| Cobus Loop Engineering | `cobusgreyling/loop-engineering` | 7 named `patterns/*.md` files | Production loop patterns for triage, PRs, CI, docs, dependencies, changelog, and cleanup. |
| Pi Pipelines | `Rybens92/pi-pipelines` | `pipelines/*.pipeline.yaml` | Declarative reusable agent-loop pipelines with review gates and goal-loop convergence. |
| Agent Loop Patterns | `rohanbalkondekar/agent-loop-patterns` | `patterns/*/README.md` | Codex-oriented queue, modernization, metric, and review-gate loop patterns. |
| Invincible Awesome Loop Engineering | `invincible04/awesome-loop-engineering` | `prompts/*.md` | Copy-paste loop prompt libraries and loop contract examples. |
| Millrace | `tim-osterhus/millrace` | `src/millrace_ai/assets/loops/**/*.json` | Runtime loop graph assets for governed long-running agent workflows. |
| Anthropic Skills | `anthropics/skills` | `skills/*/SKILL.md` | Official public skill examples and reusable agent workflow shape. |
| Addy Osmani Agent Skills | `addyosmani/agent-skills` | `skills/*/SKILL.md` | Production engineering workflows for agents. |
| Superpowers | `obra/superpowers` | `skills/*/SKILL.md` | High-signal engineering and planning skills with clean markdown structure. |
| Vercel Agent Skills | `vercel-labs/agent-skills` | `skills/*/SKILL.md` | Frontend, React, deployment, and Vercel-oriented loops. |
| PM Skills | `phuryn/pm-skills` | `pm-*/skills/*/SKILL.md` | Product-management loops that broaden the catalog beyond code. |
| Dimillian Skills | `Dimillian/Skills` | `*/SKILL.md` | Practitioner Codex skills with useful app-building and review patterns. |
| Markdown Viewer Skills | `markdown-viewer/skills` | `*/SKILL.md` | Visual, document, and communication workflows that map well to loop cards. |
| Last30Days Skill | `mvanhorn/last30days-skill` | `skills/last30days/SKILL.md` | A focused research loop for recent public-source scanning. |

## Candidate Watchlist

These are intentionally not part of the first sync because they are either
aggregators, extremely broad catalogs, or use file formats that need a better
ranking/import rule first.

- `disler/infinite-agentic-loop`
- `secret-mars/loop-starter-kit`
- `ksimback/looper`
- `renee-jia/scholar-loop`
- `DanMcInerney/architect-loop`
- `snarktank/ralph`
- `wedow/harness`
- `VoltAgent/awesome-agent-skills`
- `ComposioHQ/awesome-codex-skills`
- `google/skills`
- `K-Dense-AI/scientific-agent-skills`
- `github/awesome-copilot`
- `muratcankoylan/Agent-Skills-for-Context-Engineering`

## Updating Sources

Edit `sources/loop-repos.json`, then run:

```sh
npm run sync:loops
```

GeorgeLoops keeps stable IDs so existing public URLs continue to work. External
repos are prefixed by source, such as `anthropic-pdf` or `addy-code-review`, to
avoid collisions across repositories.
