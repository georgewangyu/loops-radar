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

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`JSON request failed: ${response.status} ${url}`);
  }

  return response.json();
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
      .replace(/\.(pipeline\.)?(md|json|ya?ml)$/i, "")
      .replace(/\/skills\//g, "/")
      .split("/")
      .filter((part) => !["loops", "goals", "skills", "examples"].includes(part))
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

function compactText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function yamlScalar(raw, key) {
  const quoted = raw.match(new RegExp(`^${key}:\\s*["']([^"']+)["']\\s*$`, "m"));
  if (quoted) {
    return compactText(quoted[1]);
  }

  const plain = raw.match(new RegExp(`^${key}:\\s*([^>\\n][^\\n]*)$`, "m"));
  if (plain) {
    return compactText(plain[1]);
  }

  const block = raw.match(new RegExp(`^${key}:\\s*>\\s*\\n((?:\\s+[^\\n]*\\n?)+)`, "m"));
  if (block) {
    return compactText(block[1].replace(/^\s+/gm, ""));
  }

  return "";
}

function extensionFor(pathname) {
  return pathname.match(/\.ya?ml$/i)
    ? "yaml"
    : pathname.match(/\.json$/i)
      ? "json"
      : "text";
}

function titleFromPath(pathname) {
  const base = pathname
    .split("/")
    .pop()
    ?.replace(/\.(pipeline\.)?(md|json|ya?ml)$/i, "");

  return titleFromId(slugify(base || pathname));
}

function artifactMetadata(pathname, raw) {
  if (pathname.endsWith(".md")) {
    return {
      name: firstHeading(raw) || titleFromPath(pathname),
      summary: firstParagraph(raw, "Reusable loop artifact."),
      steps: listItems(section(raw, "Workflow") || section(raw, "Shape")),
      verifier: firstParagraph(section(raw, "Verification Strategy"), "") ||
        firstParagraph(section(raw, "Verification"), "") ||
        "See source artifact.",
    };
  }

  if (pathname.match(/\.json$/i)) {
    try {
      const parsed = JSON.parse(raw);
      const name = parsed.name || parsed.title || parsed.loop_id || titleFromPath(pathname);
      const summary =
        parsed.objective ||
        parsed.description ||
        (parsed.plane && parsed.stages
          ? `${titleFromId(String(parsed.plane))} loop with stages: ${parsed.stages.join(", ")}.`
          : "Reusable JSON loop artifact.");
      const stages = Array.isArray(parsed.stages)
        ? parsed.stages.map((stage) =>
            typeof stage === "string"
              ? stage
              : compactText(stage.id || stage.name || stage.role || JSON.stringify(stage)),
          )
        : [];
      const gates = parsed.verification?.gates || parsed.verification?.receipts || [];
      const verifier =
        Array.isArray(gates) && gates.length > 0
          ? gates.map(compactText).join(" ")
          : parsed.terminal_results
            ? `Terminal results: ${parsed.terminal_results.join(", ")}.`
            : "See source artifact.";

      return {
        name: compactText(name),
        summary: compactText(summary),
        steps: stages,
        verifier,
      };
    } catch {
      return {
        name: titleFromPath(pathname),
        summary: "Reusable JSON loop artifact.",
        steps: [],
        verifier: "See source artifact.",
      };
    }
  }

  const name = yamlScalar(raw, "name") || titleFromPath(pathname);
  const description = yamlScalar(raw, "description") || "Reusable YAML loop artifact.";
  const stageIds = Array.from(raw.matchAll(/^\s*-\s+id:\s*([A-Za-z0-9_-]+)/gm)).map(
    (match) => match[1],
  );

  return {
    name,
    summary: description,
    steps: stageIds,
    verifier: raw.includes("gate:")
      ? "Includes review gates or goal-loop checks in the source pipeline."
      : "See source artifact.",
  };
}

function wrapArtifactMarkdown(source, pathname, raw, metadata) {
  const language = extensionFor(pathname);

  return `# ${metadata.name}

## Purpose

${metadata.summary}

## Source

- Source: ${source.label}
- Repository: ${source.repo}
- Path: ${pathname}

## Workflow

${metadata.steps.length > 0 ? metadata.steps.map((step) => `- ${step}`).join("\n") : "- See the source artifact below."}

## Verifier

${metadata.verifier}

## Source Artifact

\`\`\`${language}
${raw.trim()}
\`\`\`
`;
}

function toArtifactLoop(source, pathname, raw, usedIds) {
  const pathSlug = sourceSlug(pathname);
  const id = withUniqueId(`${source.idPrefix}-${pathSlug}`, usedIds);
  const metadata = artifactMetadata(pathname, raw);
  const markdown = wrapArtifactMarkdown(source, pathname, raw, metadata);

  return {
    id,
    name: metadata.name,
    category: source.category || "Loop artifacts",
    status: source.defaultStatus || "external",
    cadence: source.defaultCadence || "manual",
    summary: metadata.summary,
    whyUseful: metadata.summary,
    inputs: [],
    steps: metadata.steps,
    outputs: [],
    verifier: metadata.verifier,
    sourceName: source.label,
    sourceRepo: source.repo,
    sourcePath: pathname,
    sourceUrl: `https://github.com/${source.repo}/blob/${source.branch}/${encodedPath(pathname)}`,
    markdown,
  };
}

function loopLibraryMarkdown(source, loop) {
  return `# ${loop.title}

## Purpose

${loop.description || loop.useWhen || "Reusable AI-agent loop."}

## Prompt

\`\`\`text
${loop.prompt || ""}
\`\`\`

## When To Use

${loop.useWhen || "See source catalog."}

## Workflow

${Array.isArray(loop.steps) && loop.steps.length > 0 ? loop.steps.map((step) => `- ${step}`).join("\n") : "- See source catalog."}

## Verifier

${loop.verification?.title || "See source catalog."}

${loop.verification?.detail || ""}

## Notes

${loop.why || ""}

${loop.implementationNote || ""}

## Source

- Source: ${source.label}
- Author: ${loop.author || "Unknown"}
- Published: ${loop.published || "Unknown"}
- Modified: ${loop.modified || "Unknown"}
- URL: ${loop.url}
`;
}

function commandSections(markdown) {
  const sections = [];
  let currentGroup = "";
  const matches = Array.from(markdown.matchAll(/^(##|###)\s+(.+)$/gm));

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const level = match[1];
    const title = match[2].trim();
    const start = (match.index || 0) + match[0].length;
    const end = matches[index + 1]?.index || markdown.length;

    if (level === "##") {
      currentGroup = title.replace(/^[-A-Z]\.\s*/, "").trim();
      continue;
    }

    const body = markdown.slice(start, end).trim();
    if (!body.includes("```")) {
      continue;
    }

    sections.push({
      title,
      group: currentGroup,
      body,
    });
  }

  return sections;
}

function toMarkdownSectionLoop(source, pathname, section, usedIds) {
  const slug = slugify(section.title);
  const id = withUniqueId(`${source.idPrefix}-${slug}`, usedIds);
  const codeBlock = section.body.match(/```[\s\S]*?```/)?.[0] || "";
  const summary = firstParagraph(section.body.replace(codeBlock, ""), "Copyable command loop.");
  const category =
    source.categoryByGroup?.[section.group] ||
    source.category ||
    "Loop prompts";
  const markdown = `# ${section.title}

## Purpose

${summary}

## Prompt

${codeBlock || "See source section."}

## Source Notes

${section.body.replace(codeBlock, "").trim() || "See source section."}

## Source

- Source: ${source.label}
- Repository: ${source.repo}
- Path: ${pathname}#${slug}
`;

  return {
    id,
    name: section.title,
    category,
    status: source.defaultStatus || "external",
    cadence: section.group.includes("/loop")
      ? "interval"
      : section.group.includes("/schedule")
        ? "scheduled"
        : source.defaultCadence || "manual",
    summary,
    whyUseful: summary,
    inputs: [],
    steps: codeBlock ? [codeBlock.replace(/```[a-z]*\n?|```/g, "").trim()] : [],
    outputs: [],
    verifier: "Use the command's stated stop condition or source notes.",
    sourceName: source.label,
    sourceRepo: source.repo,
    sourcePath: `${pathname}#${slug}`,
    sourceUrl: `https://github.com/${source.repo}/blob/${source.branch}/${encodedPath(pathname)}#${slug}`,
    markdown,
  };
}

function toLoopLibraryLoop(source, loop, usedIds) {
  const slug = loop.slug || slugify(loop.title);
  const id = withUniqueId(`${source.idPrefix}-${slug}`, usedIds);
  const markdown = loopLibraryMarkdown(source, loop);

  return {
    id,
    name: loop.title,
    category: source.categoryBySlug?.[loop.category?.slug] || loop.category?.label || source.category || "Loop catalog",
    status: source.defaultStatus || "external",
    cadence: source.defaultCadence || "manual",
    summary: loop.description || loop.useWhen || "Reusable AI-agent loop.",
    whyUseful: loop.why || loop.useWhen || loop.description || "Reusable AI-agent loop.",
    inputs: [],
    steps: Array.isArray(loop.steps) ? loop.steps : [],
    outputs: [],
    verifier: compactText(
      [loop.verification?.title, loop.verification?.detail].filter(Boolean).join(" "),
    ) || "See source catalog.",
    sourceName: source.label,
    sourceRepo: source.repo,
    sourcePath: `catalog.json#${slug}`,
    sourceUrl: loop.url || source.catalogUrl,
    markdown,
  };
}

function generatedModule(loops, sourceCount) {
  return `// Generated by scripts/sync-georgeloops.mjs from sources/loop-repos.json.\n// Do not edit loop content by hand; update the source repos or manifest and rerun npm run sync:loops.\n\nexport type LoopStatus = string;\n\nexport type LoopCategory = string;\n\nexport type Loop = {\n  id: string;\n  name: string;\n  category: LoopCategory;\n  status: LoopStatus;\n  cadence: string;\n  summary: string;\n  whyUseful: string;\n  inputs: string[];\n  steps: string[];\n  outputs: string[];\n  verifier: string;\n  sourceName: string;\n  sourceRepo: string;\n  sourcePath: string;\n  sourceUrl: string;\n  markdown: string;\n};\n\nexport const loopSourceCount = ${sourceCount};\n\nexport const loops: Loop[] = ${JSON.stringify(loops, null, 2)};\n\nexport const categories = Array.from(new Set(loops.map((loop) => loop.category)));\nexport const statuses = Array.from(new Set(loops.map((loop) => loop.status)));\nexport const sourceNames = Array.from(new Set(loops.map((loop) => loop.sourceName)));\n\nexport function getLoopById(id: string) {\n  return loops.find((loop) => loop.id === id);\n}\n`;
}

async function syncSource(source, usedIds) {
  if (source.type === "forward-future-catalog") {
    const catalog = await fetchJson(source.catalogUrl);
    const loops = (catalog.loops || []).map((loop) =>
      toLoopLibraryLoop(source, loop, usedIds),
    );

    console.log(`Synced ${loops.length} loops from ${source.catalogUrl}`);
    return loops;
  }

  const tree = await githubJson(
    `https://api.github.com/repos/${source.repo}/git/trees/${source.branch}?recursive=1`,
  );
  const includePatterns = source.include.map((pattern) => new RegExp(pattern));
  const sourcePaths = tree.tree
    .filter((entry) => {
      return (
        entry.type === "blob" &&
        includePatterns.some((pattern) => pattern.test(entry.path))
      );
    })
    .map((entry) => entry.path)
    .sort();

  const loops = [];
  for (const sourcePath of sourcePaths) {
    const raw = await githubText(
      `https://raw.githubusercontent.com/${source.repo}/${source.branch}/${encodedPath(sourcePath)}`,
    );

    if (source.type === "markdown-sections") {
      loops.push(
        ...commandSections(raw).map((section) =>
          toMarkdownSectionLoop(source, sourcePath, section, usedIds),
        ),
      );
      continue;
    }

    loops.push(
      sourcePath.match(/\.md$/i)
        ? toLoop(source, sourcePath, raw, usedIds)
        : toArtifactLoop(source, sourcePath, raw, usedIds),
    );
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
