# Feeds

Weekly public Loops Radar feeds live here:

```text
feeds/YYYY/MM/YYYY-MM-DD.md
```

The feed is updated by the weekly Loops Radar sync automation. It highlights
newly added loops first, then falls back to a rotation from the existing catalog
when no new loops are found.

Installed agents should treat the newest feed as the digest source of truth.
They should not browse, scrape, or invent new loop updates during digest
delivery.
