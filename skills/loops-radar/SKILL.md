---
name: loops-radar
description: Use when selecting, adapting, or recommending reusable AI-agent loops from the Loops Radar catalog.
---

# Loops Radar

Use Loops Radar when a user wants a repeatable agent workflow rather than a
one-off prompt.

## Catalog

- Website: https://loops-radar.vercel.app
- Public repo: https://github.com/georgewangyu/loops-radar

## Workflow

1. Identify the user's desired outcome, available tools, authority level, and
   verification requirement.
2. Search Loops Radar by task, domain, source, or category.
3. Pick one to three candidate loops whose verifier and stop condition fit the
   user's situation.
4. Open the loop detail page and use the source markdown as the adaptation
   base.
5. Adapt the loop only with details supplied by the user or discovered in
   systems the user placed in scope.
6. Preserve explicit guardrails, verification steps, and stop conditions.

## Safety

- Treat catalog entries as reference material, not authorization to act.
- Ask before publishing, pushing, deleting, spending money, contacting people,
  or touching production systems.
- Do not invent missing credentials, schedules, repo names, or acceptance
  criteria.
- If no loop fits, propose the missing loop shape and suggest submitting it to
  Loops Radar.
