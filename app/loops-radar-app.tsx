"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Loop } from "@/lib/loops";
import { categories, loopSourceCount, sourceNames, statuses } from "@/lib/loops";

type Status = "idle" | "submitting" | "success" | "error";

type ErrorResponse = {
  error?: string;
  issues?: Record<string, string[] | undefined>;
};

type Props = {
  loops: Loop[];
};

type SortMode = "balanced" | "featured" | "newest" | "title";

const submissionTypes = [
  ["submit-loop", "Submit loop"],
  ["request-loop", "Request loop"],
  ["improve-loop", "Improve loop"],
] as const;

const sortOptions: Array<[SortMode, string]> = [
  ["balanced", "Balanced sources"],
  ["featured", "Featured first"],
  ["newest", "Newest first"],
  ["title", "A-Z"],
];

const pageSize = 12;

const issueLabels: Record<string, string> = {
  title: "Loop title",
  outcome: "What this helps someone do",
  steps: "Rough steps",
  context: "Link or context",
  handle: "Handle",
};

const skillInstallCommand = "npx skills add georgewangyu/loops-radar --skill loops-radar -g";

const featuredLoopIds = new Set([
  "refactor-until-architecture-settles",
  "weekly-agent-loop-scan",
  "forward-future-overnight-docs-sweep",
  "forward-future-architecture-satisfaction-loop",
  "forward-future-full-product-evaluation-loop",
  "awesome-agent-loops-kill-flaky-tests",
  "awesome-agent-loops-run-until-green",
  "chaoyue-bug-hunting-loop",
  "cobus-patterns-pr-babysitter",
  "pi-pipelines-pipelines-automatic-loop",
  "agent-loop-patterns-patterns-metric-optimization-loop-readme",
  "invincible-goal-and-loop",
  "anthropic-code-reviewer",
  "addy-code-review-and-quality",
  "superpowers-execute-tasks",
  "vercel-deploy-to-vercel",
  "pm-pm-execution-sprint-plan",
  "dimillian-review-and-simplify-changes",
]);

async function errorMessageFor(response: Response) {
  if (response.status !== 400) {
    return "Something went wrong. Try again or send the idea another way.";
  }

  const body = (await response.json().catch(() => null)) as ErrorResponse | null;
  const fieldMessages = Object.entries(body?.issues || {}).flatMap(
    ([field, messages]) =>
      (messages || []).map((message) => `${issueLabels[field] || field}: ${message}`),
  );

  return fieldMessages.length > 0
    ? fieldMessages.join(" ")
    : body?.error || "Please check the form and try again.";
}

function parseLoopDate(loop: Loop) {
  const isoMatch = loop.markdown.match(/\b(20\d{2}-\d{2}-\d{2})\b/);

  if (isoMatch) {
    return Date.parse(`${isoMatch[1]}T00:00:00Z`);
  }

  const writtenMatch = loop.markdown.match(
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+20\d{2}\b/i,
  );

  return writtenMatch ? Date.parse(writtenMatch[0]) : 0;
}

function featuredScore(loop: Loop) {
  if (featuredLoopIds.has(loop.id)) {
    return 3;
  }

  const text = `${loop.name} ${loop.summary} ${loop.markdown}`.toLowerCase();

  if (text.includes("featured")) {
    return 2;
  }

  if (
    text.includes("evaluation") ||
    text.includes("review") ||
    text.includes("verification") ||
    text.includes("architecture") ||
    text.includes("product")
  ) {
    return 1;
  }

  return 0;
}

function compareByTitle(left: Loop, right: Loop) {
  return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
}

function compareForFeatured(left: Loop, right: Loop) {
  return (
    featuredScore(right) - featuredScore(left) ||
    parseLoopDate(right) - parseLoopDate(left) ||
    compareByTitle(left, right)
  );
}

function balanceBySource(items: Loop[], sourceOrder: Map<string, number>, sortGroup = compareForFeatured) {
  const groups = new Map<string, Loop[]>();

  for (const loop of items) {
    const group = groups.get(loop.sourceName) || [];
    group.push(loop);
    groups.set(loop.sourceName, group);
  }

  for (const group of groups.values()) {
    group.sort(sortGroup);
  }

  const orderedSources = Array.from(groups.keys()).sort((left, right) => {
    return (sourceOrder.get(left) ?? 999) - (sourceOrder.get(right) ?? 999);
  });
  const balanced: Loop[] = [];
  let index = 0;

  while (balanced.length < items.length) {
    for (const sourceName of orderedSources) {
      const group = groups.get(sourceName);

      if (group?.[index]) {
        balanced.push(group[index]);
      }
    }

    index += 1;
  }

  return balanced;
}

function sortLoops(items: Loop[], sortMode: SortMode, sourceOrder: Map<string, number>) {
  if (sortMode === "title") {
    return [...items].sort(compareByTitle);
  }

  if (sortMode === "newest") {
    return [...items].sort((left, right) => {
      return parseLoopDate(right) - parseLoopDate(left) || compareForFeatured(left, right);
    });
  }

  if (sortMode === "featured") {
    return [...items].sort(compareForFeatured);
  }

  return balanceBySource(items, sourceOrder);
}

export function LoopsRadarApp({ loops }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [source, setSource] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("balanced");
  const [submissionType, setSubmissionType] = useState("submit-loop");
  const [formStatus, setFormStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [page, setPage] = useState(1);
  const [quickSubmitOpen, setQuickSubmitOpen] = useState(false);
  const sourceOrder = useMemo(
    () => new Map(sourceNames.map((sourceName, index) => [sourceName, index])),
    [],
  );

  const filteredLoops = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return loops.filter((loop) => {
      const matchesCategory = category === "All" || loop.category === category;
      const matchesStatus = status === "All" || loop.status === status;
      const matchesSource = source === "All" || loop.sourceName === source;
      const haystack = [
        loop.name,
        loop.summary,
        loop.whyUseful,
        loop.category,
        loop.status,
        loop.cadence,
        loop.sourceName,
        loop.sourceRepo,
        loop.markdown,
        loop.inputs.join(" "),
        loop.steps.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesCategory &&
        matchesStatus &&
        matchesSource &&
        (!normalizedQuery || haystack.includes(normalizedQuery))
      );
    });
  }, [category, loops, query, source, status]);
  const sortedLoops = useMemo(
    () => sortLoops(filteredLoops, sortMode, sourceOrder),
    [filteredLoops, sortMode, sourceOrder],
  );

  const pageCount = Math.max(1, Math.ceil(sortedLoops.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, sortedLoops.length);
  const visibleLoops = sortedLoops.slice(pageStart, pageEnd);

  useEffect(() => {
    setPage(1);
  }, [category, query, source, sortMode, status]);

  async function copyLoop(loop: Loop) {
    await navigator.clipboard.writeText(loop.markdown);
    setCopied(loop.id);
    window.setTimeout(() => setCopied(""), 1400);
  }

  async function copySetupCommand() {
    await navigator.clipboard.writeText(skillInstallCommand);
    setCopied("setup-command");
    window.setTimeout(() => setCopied(""), 1400);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setFormStatus("submitting");
    setError("");

    const form = new FormData(formElement);
    const payload = {
      submissionType: String(form.get("submissionType") || submissionType),
      visibility: String(form.get("visibility") || "public"),
      title: String(form.get("title") || ""),
      outcome: String(form.get("outcome") || ""),
      steps: String(form.get("steps") || ""),
      context: String(form.get("context") || ""),
      handle: String(form.get("handle") || ""),
      website: String(form.get("website") || ""),
    };

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setFormStatus("error");
        setError(await errorMessageFor(response));
        return;
      }

      formElement.reset();
      setSubmissionType("submit-loop");
      setFormStatus("success");
    } catch {
      setFormStatus("error");
      setError("Something went wrong. Try again or send the idea another way.");
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="mark">LR</span>
          <span>Loops Radar</span>
        </a>
        <nav className="nav-pills" aria-label="Page navigation">
          <a href="#catalog">Catalog</a>
          <a href="#submit">Submit</a>
        </nav>
        <a className="primary nav-submit" href="#submit">
          Submit loop
        </a>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Catalog-first agent workflows</p>
          <h1 id="page-title">Loops Radar</h1>
          <p className="hero-copy">
            A searchable public index of reusable loops for agents, research,
            content, coding, and personal ops. Open a loop, copy the recipe, or
            submit an improvement.
          </p>
        </div>
        <aside className="hero-note">
          <strong>{loops.length} loops loaded</strong>
          <span>
            Synced from {loopSourceCount} public markdown sources and balanced
            across loop catalogs, patterns, and agent skills.
          </span>
        </aside>
      </section>

      <section className="agent-setup" aria-labelledby="agent-setup-title">
        <div>
          <p className="eyebrow">Agent skill</p>
          <h2 id="agent-setup-title">Use Loops Radar in your coding agent.</h2>
          <p>
            Install the skill so your agent can search the catalog, choose a
            relevant loop, and adapt the source markdown into the work at hand.
          </p>
        </div>
        <div className="setup-command">
          <code>{skillInstallCommand}</code>
          <div className="setup-actions">
            <button onClick={copySetupCommand} type="button">
              {copied === "setup-command" ? "Copied" : "Copy command"}
            </button>
            <a href="https://github.com/georgewangyu/loops-radar">
              View repository
            </a>
          </div>
        </div>
      </section>

      <section className="product-grid" id="catalog" aria-label="Loops catalog">
        <aside className="product-nav" aria-label="Catalog filters">
          <p className="rail-title">Status</p>
          <div className="rail-list">
            {["All", ...statuses].map((item) => (
              <button
                className={status === item ? "rail-item active" : "rail-item"}
                key={item}
                onClick={() => setStatus(item)}
                type="button"
              >
                <span>{item}</span>
                <span>
                  {item === "All"
                    ? loops.length
                    : loops.filter((loop) => loop.status === item).length}
                </span>
              </button>
            ))}
          </div>

          <p className="rail-title lower">Collections</p>
          <div className="rail-list">
            {categories.map((item) => (
              <button
                className={category === item ? "rail-item active" : "rail-item"}
                key={item}
                onClick={() => setCategory(item)}
                type="button"
              >
                <span>{item}</span>
                <span>{loops.filter((loop) => loop.category === item).length}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="product-main" aria-label="Loops">
          <div className="catalog-toolbar">
            <label className="search-input">
              <span className="sr-only">Search loops</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search loops..."
              />
            </label>
            <div className="toolbar-selects" aria-label="Catalog filters">
              <label className="select-control">
                <span>Sort</span>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                >
                  {sortOptions.map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="select-control">
                <span>Collection</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="All">All collections</option>
                  {categories.map((item) => (
                    <option value={item} key={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="select-control">
                <span>Source</span>
                <select value={source} onChange={(event) => setSource(event.target.value)}>
                  <option value="All">All sources</option>
                  {sourceNames.map((item) => (
                    <option value={item} key={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <section className="quick-submit" aria-label="Quick loop submission">
            <div>
              <p className="eyebrow">Contribute</p>
              <h2>Missing a loop?</h2>
              <p>
                Send a rough workflow from here without scrolling to the full
                request form.
              </p>
            </div>
            <div className="quick-submit-actions">
              <button
                className="primary"
                onClick={() => setQuickSubmitOpen((value) => !value)}
                type="button"
              >
                {quickSubmitOpen ? "Close quick form" : "Open quick form"}
              </button>
              <a className="text-button" href="#submit">
                Full form
              </a>
            </div>
            {quickSubmitOpen ? (
              <form className="quick-submit-form" onSubmit={onSubmit}>
                <input name="submissionType" type="hidden" value="submit-loop" />
                <input name="visibility" type="hidden" value="public" />
                <input className="trap" name="website" tabIndex={-1} autoComplete="off" />
                <label>
                  <span>Title</span>
                  <input
                    name="title"
                    placeholder="A repeatable workflow name"
                    minLength={4}
                    maxLength={120}
                    required
                  />
                </label>
                <label>
                  <span>Outcome</span>
                  <textarea
                    name="outcome"
                    placeholder="What does this help someone do?"
                    minLength={10}
                    maxLength={1200}
                    required
                  />
                </label>
                <label>
                  <span>Steps</span>
                  <textarea
                    name="steps"
                    placeholder="Paste the rough loop shape..."
                    minLength={10}
                    maxLength={2500}
                    required
                  />
                </label>
                <label>
                  <span>Link or context</span>
                  <input name="context" placeholder="Optional repo, post, or note" />
                </label>
                <input name="handle" type="hidden" value="" />
                <button disabled={formStatus === "submitting"} type="submit">
                  {formStatus === "submitting" ? "Sending..." : "Create issue"}
                </button>
                {formStatus === "success" ? (
                  <div className="notice success">Submission sent.</div>
                ) : null}
                {formStatus === "error" ? (
                  <div className="notice error">{error}</div>
                ) : null}
              </form>
            ) : null}
          </section>

          <div className="list-meta">
            <span>
              {sortedLoops.length} matching loops
              {sortedLoops.length > 0
                ? ` / showing ${pageStart + 1}-${pageEnd}`
                : ""}
            </span>
            <span className="sort-note">
              {sortOptions.find(([value]) => value === sortMode)?.[1]}
            </span>
            {(query ||
              category !== "All" ||
              status !== "All" ||
              source !== "All" ||
              sortMode !== "balanced") && (
              <button
                className="text-button"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                  setStatus("All");
                  setSource("All");
                  setSortMode("balanced");
                  setPage(1);
                }}
                type="button"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="product-table">
            {visibleLoops.length > 0 ? (
              visibleLoops.map((loop) => (
                <article
                  className="product-row"
                  id={loop.id}
                  key={loop.id}
                >
                  <Link
                    className="loop-row-main"
                    href={`/loops/${loop.id}`}
                  >
                    <span className="loop-kicker">
                      {loop.category} / {loop.sourceName}
                    </span>
                    <span className="loop-name">{loop.name}</span>
                    <span className="loop-desc">{loop.summary}</span>
                  </Link>
                  <button
                    className="copy loop-copy"
                    onClick={() => copyLoop(loop)}
                    type="button"
                  >
                    {copied === loop.id ? "Copied" : "Copy loop"}
                  </button>
                  <Link className="text-button row-open" href={`/loops/${loop.id}`}>
                    Open
                  </Link>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <h2>No matching loops</h2>
                <p>Try clearing a filter or submit the loop you expected to find.</p>
              </div>
            )}
          </div>

          {sortedLoops.length > pageSize ? (
            <nav className="pagination" aria-label="Loop pagination">
              <button
                className="page-button"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                type="button"
              >
                Previous
              </button>
              <span className="page-status">
                Page {currentPage} of {pageCount}
              </span>
              <button
                className="page-button"
                disabled={currentPage === pageCount}
                onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                type="button"
              >
                Next
              </button>
            </nav>
          ) : null}
        </section>
      </section>

      <section className="submit-section" id="submit">
        <div>
          <p className="eyebrow">Contribution intake</p>
          <h2>Submit to Loops Radar</h2>
          <p>
            Public is the default. Private review is still available for ideas
            that need a quieter path before they become a visible issue.
          </p>
        </div>

        <form className="submit-form" onSubmit={onSubmit}>
          <input className="trap" name="website" tabIndex={-1} autoComplete="off" />

          <section className="field field-wide">
            <span className="label">Request type</span>
            <div className="chips">
              {submissionTypes.map(([value, label]) => (
                <button
                  className={submissionType === value ? "chip active" : "chip"}
                  key={value}
                  onClick={() => setSubmissionType(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <label className="field">
            <span className="label">Issue route</span>
            <select name="visibility" defaultValue="public">
              <option value="public">Public GitHub issue</option>
              <option value="private">Private review issue</option>
            </select>
          </label>

          <label className="field">
            <span className="label">Handle optional</span>
            <input name="handle" placeholder="@handle or leave blank" />
          </label>

          <label className="field field-wide">
            <span className="label">Loop title</span>
            <input
              name="title"
              placeholder="A repeatable workflow name"
              minLength={4}
              maxLength={120}
              required
            />
          </label>

          <label className="field field-wide">
            <span className="label">What does this help someone do?</span>
            <textarea
              name="outcome"
              placeholder="Describe the repeatable pain, workflow, or outcome..."
              minLength={10}
              maxLength={1200}
              required
            />
          </label>

          <label className="field field-wide">
            <span className="label">Rough steps</span>
            <textarea
              name="steps"
              placeholder="Paste rough steps, examples, or the workflow shape..."
              minLength={10}
              maxLength={2500}
              required
            />
          </label>

          <label className="field field-wide">
            <span className="label">Link or context</span>
            <input name="context" placeholder="Optional repo, post, video, note, or example" />
          </label>

          <div className="actions field-wide">
            <button disabled={formStatus === "submitting"} type="submit">
              {formStatus === "submitting" ? "Sending..." : "Create issue"}
            </button>
          </div>

          {formStatus === "success" ? (
            <div className="notice success field-wide">
              Submission sent. If it has signal, it goes into the Loops Radar
              triage queue.
            </div>
          ) : null}

          {formStatus === "error" ? (
            <div className="notice error field-wide">{error}</div>
          ) : null}
        </form>
      </section>
    </main>
  );
}
