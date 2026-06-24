import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const loopsPath = path.join(root, "lib", "loops.ts");
const memoryPath = path.join(root, "memory", "seen-loop-ids.json");
const feedRoot = path.join(root, "feeds");
const maxFeatured = 12;
const coreDigestIds = [
  "daily-morning-routine",
  "cobus-patterns-daily-triage",
  "forward-future-living-story-loop",
  "forward-future-goal-forge-loop",
  "weekly-agent-loop-scan",
  "invincible-prompts-loop-contracts",
  "invincible-prompts-goal-and-loop",
  "invincible-prompts-automations",
  "forward-future-codex-completion-contract-loop",
  "biweekly-sprint-retro-and-next-sprint-planning",
];

function localDate() {
  if (process.env.LOOPS_RADAR_FEED_DATE) {
    return process.env.LOOPS_RADAR_FEED_DATE;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Los_Angeles",
    year: "numeric",
  }).formatToParts(new Date());
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${byType.year}-${byType.month}-${byType.day}`;
}

async function readLoops() {
  const source = await readFile(loopsPath, "utf8");
  const marker = "export const loops: Loop[] = ";
  const start = source.indexOf(marker);
  const end = source.indexOf("\n];\n\nexport const categories", start);

  if (start === -1 || end === -1) {
    throw new Error("Could not locate generated loops array in lib/loops.ts");
  }

  return JSON.parse(source.slice(start + marker.length, end + 2));
}

async function readSeenIds() {
  if (process.env.LOOPS_RADAR_FEED_RESET === "1") {
    return new Set();
  }

  try {
    const raw = await readFile(memoryPath, "utf8");
    const parsed = JSON.parse(raw);

    return new Set(Array.isArray(parsed.loopIds) ? parsed.loopIds : []);
  } catch (error) {
    if (error.code === "ENOENT") {
      return new Set();
    }

    throw error;
  }
}

function loopScore(loop) {
  const text = `${loop.name} ${loop.category} ${loop.summary} ${loop.markdown}`.toLowerCase();
  let score = 0;

  for (const term of [
    "morning",
    "start-of-day",
    "start of day",
    "goal",
    "daily",
    "triage",
    "story",
    "context",
    "digest",
    "recommend",
    "review",
    "verify",
    "automation",
    "loop",
    "workflow",
  ]) {
    if (text.includes(term)) {
      score += 1;
    }
  }

  if (loop.sourceName === "Forward Future Loop Library") score += 3;
  if (loop.sourceName === "GeorgeLoops") score += 2;
  if (/goal|daily|loop pattern|engineering/i.test(loop.category)) score += 2;

  return score;
}

function selectFeatured(loops, seenIds) {
  const newLoops = loops.filter((loop) => !seenIds.has(loop.id));
  const pool = newLoops.length > 0 ? newLoops : loops;
  const byId = new Map(pool.map((loop) => [loop.id, loop]));
  const required = coreDigestIds.map((id) => byId.get(id)).filter(Boolean);
  const requiredIds = new Set(required.map((loop) => loop.id));
  const scored = [...pool]
    .filter((loop) => !requiredIds.has(loop.id))
    .sort((left, right) => loopScore(right) - loopScore(left) || left.name.localeCompare(right.name));

  return {
    hasNewLoops: newLoops.length > 0,
    newLoopCount: newLoops.length,
    featured: [...required, ...scored].slice(0, maxFeatured),
  };
}

function dailyRotation(featured) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return days.map((day, dayIndex) => ({
    day,
    loops: featured.slice(dayIndex * 2, dayIndex * 2 + 2),
  }));
}

function oneLine(value, fallback = "See source markdown.") {
  return (value || fallback).replace(/\s+/g, " ").trim();
}

function renderFeed({ date, loops, seenIds, featured, hasNewLoops, newLoopCount }) {
  const sourceCount = new Set(loops.map((loop) => loop.sourceName)).size;
  const rotation = dailyRotation(featured);
  const loopIds = featured.map((loop) => loop.id);

  return `# Loops Radar Weekly Feed - ${date}

Updated after the Loops Radar weekly source sync.

<!-- loops-radar-feed-version: 1 -->
<!-- featured-loop-ids: ${loopIds.join(", ")} -->

## Summary

- Catalog count: ${loops.length} loops from ${sourceCount} public sources.
- New loops since the last feed: ${hasNewLoops ? newLoopCount : 0}.
- Featured this week: ${featured.length}.
- Feed mode: ${hasNewLoops ? "new loops first" : "rotation from the existing catalog"}.

## Featured Loops

${featured
  .map(
    (loop) => `- [${loop.name}](https://loopsradar.snackoverflowgeorge.com/loops/${loop.id})
  - Source: ${loop.sourceName} / ${loop.sourceRepo}
  - Category: ${loop.category}
  - Status: ${loop.status}
  - Why it matters: ${oneLine(loop.summary)}
  - Source markdown: ${loop.sourceUrl}`,
  )
  .join("\n\n")}

## Daily Digest Rotation

Use these as lightweight daily picks until the next weekly sync.

${rotation
  .filter((entry) => entry.loops.length > 0)
  .map(
    (entry) => `- ${entry.day}: ${entry.loops
      .map((loop) => `[${loop.name}](https://loopsradar.snackoverflowgeorge.com/loops/${loop.id})`)
      .join(" + ")}`,
  )
  .join("\n")}

## Agent Setup Prompt

Ask your agent:

\`\`\`text
Use Loops Radar. Read the latest weekly feed, choose one or two loops relevant
to my current work, summarize why they matter, and adapt the source markdown
into the next concrete goal or workflow.
\`\`\`

## Daily Outlook Prompt

For a lightweight morning recommendation, ask:

\`\`\`text
Use Loops Radar and give me Recommended today. Keep it compact:
1 primary goal, 1 maintenance loop, and 1 content or research loop.
Use the latest weekly feed first, then adapt to my current work if you have
enough context.
\`\`\`

## Builder Takeaways

- Use: pick one loop from the weekly feed for the next work session.
- Study: inspect the source markdown before adapting it.
- Submit: if a useful workflow is missing, send it through the Loops Radar form.

## Source Receipts

${featured.map((loop) => `- ${loop.sourceUrl}`).join("\n")}
`;
}

async function main() {
  const date = localDate();
  const [year, month] = date.split("-");
  const loops = await readLoops();
  const seenIds = await readSeenIds();
  const selection = selectFeatured(loops, seenIds);
  const feedDir = path.join(feedRoot, year, month);
  const feedPath = path.join(feedDir, `${date}.md`);

  await mkdir(feedDir, { recursive: true });
  await mkdir(path.dirname(memoryPath), { recursive: true });
  await writeFile(
    feedPath,
    renderFeed({ date, loops, seenIds, ...selection }),
    "utf8",
  );
  await writeFile(
    memoryPath,
    `${JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        loopCount: loops.length,
        loopIds: loops.map((loop) => loop.id).sort(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        feedPath,
        featuredCount: selection.featured.length,
        hasNewLoops: selection.hasNewLoops,
        newLoopCount: selection.newLoopCount,
        loopCount: loops.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
