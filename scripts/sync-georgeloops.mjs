import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_CONFIG_PATH = path.join("sources", "loop-repos.json");

const georgeCategoryById = {
  "daily-morning-routine": "Daily workflow",
  "biweekly-sprint-retro-and-next-sprint-planning": "Daily workflow",
  "nightly-commit-and-push-review": "Repository ops",
  "georgerepo-cleanup-candidate-scan": "Repository ops",
  "cross-repo-pattern-propagation-scan": "Repository ops",
  "weekly-file-organization-review": "Repository ops",
  "wake-codex-repo-maintenance-loop": "Repository ops",
  "nightly-daily-workflow-social-draft-loop": "Content",
  "monitor-ai-warehouse-and-wono": "Research",
  "weekly-agent-loop-scan": "Meta systems",
  "weekly-codex-automation-catalog-sync": "Meta systems",
  "codex-thread-title-hygiene": "Meta systems",
  "monthly-skill-cleaner-scan": "Meta systems",
  "refactor-until-architecture-settles": "Goal recipe",
};

async function githubJson(url) {
  const response = await fetch(url, {
    headers: process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : undefined,
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status} ${url}`);
  }

  return response.json();
}

async function githubText(url) {
  const response = await fetch(url, {
    headers: process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : undefined,
  });

  if (!response.ok) {
    throw new Error(`GitHub raw request failed: ${response.status} ${url}`);
  }

  return response.text();
}

async function readSources() {
  const raw = await readFile(SOURCE_CONFIG_PATH, "utf8");
  return JSON.parse(raw);
}

function encodedPath(pathname) {
  return pathname.split("/").map(encodeURIComponent).join("/");
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  const fields = {};

  if (!match) {
    return fields;
  }

  for (const line of match[1].split("\n")) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) {
      continue;
    }

    fields[field[1]] = field[2].trim().replace(/^["']|["']$/g, "");
  }

  return fields;
}

function stripFrontmatter(markdown) {
  return markdown.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
}

function section(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(
    new RegExp(`(?:^|\\n)## ${escaped}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, "i"),
  );
  return match?.[1]?.trim() || "";
}

function firstHeading(markdown) {
  return stripFrontmatter(markdown).match(/^#\s+(.+)$/m)?.[1]?.trim() || "";
}

function firstParagraph(text, fallback) {
  const paragraph = text
    .replace(/```[\s\S]*?```/g, "")
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s*\n\s*/g, " ").trim())
    .find((part) => {
      return (
        part &&
        !part.startsWith("#") &&
        !part.startsWith("- ") &&
        !/^\d+\.\s/.test(part)
      );
    });

  return paragraph || fallback;
}

function listItems(text) {
  const items = [];

  for (const line of text.split("\n")) {
    const bullet = line.match(/^\s*-\s+(.+)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.+)$/);
    const item = bullet?.[1] || numbered?.[1];

    if (item) {
      items.push(item.trim());
    }
  }

  return items;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromId(id) {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sourceSlug(pathname) {
  return slugify(
    pathname
      .replace(/\/(LOOP|GOAL|SKILL)\.md$/i, "")
      .replace(/\/skills\//g, "/")
      .split("/")
      .filter((part) => !["loops", "goals", "skills"].includes(part))
      .join("-"),
  );
}

function withUniqueId(id, usedIds) {
  if (!usedIds.has(id)) {
    usedIds.add(id);
    return id;
  }

  let index = 2;
  while (usedIds.has(`${id}-${index}`)) {
    index += 1;
  }

  const uniqueId = `${id}-${index}`;
  usedIds.add(uniqueId);
  return uniqueId;
}

function toLoop(source, pathname, markdown, usedIds) {
  const frontmatter = parseFrontmatter(markdown);
  const heading = firstHeading(markdown);
  const pathSlug = sourceSlug(pathname);
  const baseId = source.preserveIds
    ? frontmatter.id || pathSlug
    : `${source.idPrefix}-${frontmatter.id ? slugify(frontmatter.id) : pathSlug}`;
  const id = withUniqueId(baseId, usedIds);
  const name =
    frontmatter.name ||
    frontmatter.title ||
    heading ||
    titleFromId(pathSlug || id.replace(`${source.idPrefix}-`, ""));
  const purpose = section(markdown, "Purpose");
  const overview = section(markdown, "Overview");
  const description = frontmatter.description || firstParagraph(purpose || overview, "");
  const bodyFallback = firstParagraph(
    stripFrontmatter(markdown),
    "See the source markdown for the loop details.",
  );
  const whyUseful = section(markdown, "Why It Is Useful");
  const workflow =
    section(markdown, "Workflow") ||
    section(markdown, "Process") ||
    section(markdown, "Instructions") ||
    section(markdown, "Steps");
  const outputs = section(markdown, "Outputs") || section(markdown, "Deliverables");
  const verifier =
    firstParagraph(section(markdown, "Verifier"), "") ||
    firstParagraph(section(markdown, "Completion Criteria"), "") ||
    "See source markdown.";

  return {
    id,
    name,
    category:
      source.categoryById?.[frontmatter.id || pathSlug] ||
      georgeCategoryById[frontmatter.id || pathSlug] ||
      source.category ||
      "External skills",
    status: frontmatter.status || source.defaultStatus || "reference",
    cadence: frontmatter.cadence || frontmatter.runtime || source.defaultCadence || "manual",
    summary: description || bodyFallback,
    whyUseful: firstParagraph(whyUseful || purpose || overview, description || bodyFallback),
    inputs: listItems(section(markdown, "Inputs")),
    steps: listItems(workflow),
    outputs: listItems(outputs),
    verifier,
    sourceName: source.label,
    sourceRepo: source.repo,
    sourcePath: pathname,
    sourceUrl: `https://github.com/${source.repo}/blob/${source.branch}/${encodedPath(pathname)}`,
    markdown,
  };
}

function generatedModule(loops, sourceCount) {
  return `// Generated by scripts/sync-georgeloops.mjs from sources/loop-repos.json.\n// Do not edit loop content by hand; update the source repos or manifest and rerun npm run sync:loops.\n\nexport type LoopStatus = string;\n\nexport type LoopCategory = string;\n\nexport type Loop = {\n  id: string;\n  name: string;\n  category: LoopCategory;\n  status: LoopStatus;\n  cadence: string;\n  summary: string;\n  whyUseful: string;\n  inputs: string[];\n  steps: string[];\n  outputs: string[];\n  verifier: string;\n  sourceName: string;\n  sourceRepo: string;\n  sourcePath: string;\n  sourceUrl: string;\n  markdown: string;\n};\n\nexport const loopSourceCount = ${sourceCount};\n\nexport const loops: Loop[] = ${JSON.stringify(loops, null, 2)};\n\nexport const categories = Array.from(new Set(loops.map((loop) => loop.category)));\nexport const statuses = Array.from(new Set(loops.map((loop) => loop.status)));\nexport const sourceNames = Array.from(new Set(loops.map((loop) => loop.sourceName)));\n\nexport function getLoopById(id: string) {\n  return loops.find((loop) => loop.id === id);\n}\n`;
}

async function syncSource(source, usedIds) {
  const tree = await githubJson(
    `https://api.github.com/repos/${source.repo}/git/trees/${source.branch}?recursive=1`,
  );
  const includePatterns = source.include.map((pattern) => new RegExp(pattern));
  const markdownPaths = tree.tree
    .filter((entry) => {
      return (
        entry.type === "blob" &&
        includePatterns.some((pattern) => pattern.test(entry.path))
      );
    })
    .map((entry) => entry.path)
    .sort();

  const loops = [];
  for (const markdownPath of markdownPaths) {
    const markdown = await githubText(
      `https://raw.githubusercontent.com/${source.repo}/${source.branch}/${encodedPath(markdownPath)}`,
    );
    loops.push(toLoop(source, markdownPath, markdown, usedIds));
  }

  console.log(`Synced ${loops.length} documents from ${source.repo}@${source.branch}`);
  return loops;
}

async function main() {
  const sources = await readSources();
  const usedIds = new Set();
  const loops = [];

  for (const source of sources) {
    loops.push(...(await syncSource(source, usedIds)));
  }

  await mkdir("lib", { recursive: true });
  await writeFile(path.join("lib", "loops.ts"), generatedModule(loops, sources.length));
  console.log(`Synced ${loops.length} loop documents from ${sources.length} sources`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
