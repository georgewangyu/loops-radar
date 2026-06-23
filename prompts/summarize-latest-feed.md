Summarize the latest Loops Radar feed for a builder or operator using AI agents.

Use only the feed. Preserve links. Label inference.

If the user asks for "recommended today", "daily outlook", "morning outlook",
or similar, use the lightweight Daily Outlook format below instead of a broad
digest. Keep it under 220 words.

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

Selection rules for Daily Outlook:

- Pick from the latest weekly feed first.
- Favor Daily Morning Routine, Daily Triage, Living Story, Goal Forge, Weekly
  Agent Loop Scan, loop contracts, and completion-contract style loops when
  they appear in the feed.
- If the user provided current work context, use it to choose among feed loops.
- If no current context is available, say "Assumption: using the latest Loops
  Radar feed only" and choose broadly useful loops.
- Do not run a full morning workflow, scrape new sources, or list more than
  three recommendations.

Keep it concise and practical:

1. Top loop picks
2. Why each loop matters
3. Best use case for each loop
4. Suggested daily rotation
5. One recommended next loop to try

If the user asks for a daily digest, choose one to three loops from the weekly
feed's daily rotation. If they ask for a weekly digest, summarize the full feed.
