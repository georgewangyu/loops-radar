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

const submissionTypes = [
  ["submit-loop", "Submit loop"],
  ["request-loop", "Request loop"],
  ["improve-loop", "Improve loop"],
] as const;

const pageSize = 24;

const issueLabels: Record<string, string> = {
  title: "Loop title",
  outcome: "What this helps someone do",
  steps: "Rough steps",
  context: "Link or context",
  handle: "Handle",
};

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

export function LoopsRadarApp({ loops }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [source, setSource] = useState("All");
  const [selectedId, setSelectedId] = useState(loops[0]?.id || "");
  const [submissionType, setSubmissionType] = useState("submit-loop");
  const [formStatus, setFormStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [page, setPage] = useState(1);

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

  const pageCount = Math.max(1, Math.ceil(filteredLoops.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filteredLoops.length);
  const visibleLoops = filteredLoops.slice(pageStart, pageEnd);

  useEffect(() => {
    setPage(1);
  }, [category, query, source, status]);

  const selectedLoop =
    filteredLoops.find((loop) => loop.id === selectedId) || filteredLoops[0] || loops[0];

  function previewLoop(loop: Loop) {
    setSelectedId(loop.id);
    window.history.replaceState(null, "", `#${loop.id}`);
  }

  async function copyLoop(loop: Loop) {
    await navigator.clipboard.writeText(loop.markdown);
    setCopied(loop.id);
    window.setTimeout(() => setCopied(""), 1400);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setFormStatus("submitting");
    setError("");

    const form = new FormData(formElement);
    const payload = {
      submissionType,
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
          <a href="#selected">Selected loop</a>
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
            Synced from {loopSourceCount} public markdown sources, starting with
            GeorgeLoops and selected agent-skill repos.
          </span>
        </aside>
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

          <div className="list-meta">
            <span>
              {filteredLoops.length} matching loops
              {filteredLoops.length > 0
                ? ` / showing ${pageStart + 1}-${pageEnd}`
                : ""}
            </span>
            {(query || category !== "All" || status !== "All" || source !== "All") && (
              <button
                className="text-button"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                  setStatus("All");
                  setSource("All");
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
                  className={
                    selectedLoop?.id === loop.id
                      ? "product-row selected"
                      : "product-row"
                  }
                  id={loop.id}
                  key={loop.id}
                >
                  <Link
                    className="loop-row-main"
                    href={`/loops/${loop.id}`}
                  >
                    <span className="loop-name">{loop.name}</span>
                    <span className="loop-desc">{loop.summary}</span>
                  </Link>
                  <span className="tag">{loop.category}</span>
                  <span className={`status status-${loop.status}`}>
                    {loop.status}
                  </span>
                  <button
                    className="copy preview"
                    onClick={() => previewLoop(loop)}
                    type="button"
                  >
                    Preview
                  </button>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <h2>No matching loops</h2>
                <p>Try clearing a filter or submit the loop you expected to find.</p>
              </div>
            )}
          </div>

          {filteredLoops.length > pageSize ? (
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

        {selectedLoop ? (
          <aside
            className="product-detail"
            id="selected"
            aria-labelledby="selected-title"
          >
            <div className="detail-heading">
              <div>
                <p className="eyebrow">{selectedLoop.category}</p>
                <h2 id="selected-title">{selectedLoop.name}</h2>
              </div>
              <button
                className="copy"
                onClick={() => copyLoop(selectedLoop)}
                type="button"
              >
                {copied === selectedLoop.id ? "Copied" : "Copy"}
              </button>
            </div>

            <p>{selectedLoop.whyUseful}</p>

            <div className="detail-meta-strip" aria-label="Selected loop metadata">
              <span className={`status status-${selectedLoop.status}`}>
                {selectedLoop.status}
              </span>
              <span>{selectedLoop.cadence}</span>
            </div>

            <div className="verifier-panel">
              <h3>Verifier</h3>
              <p>{selectedLoop.verifier}</p>
            </div>

            <div className="mini-section">
              <h3>Inputs</h3>
              <ul>
                {selectedLoop.inputs.map((input) => (
                  <li key={input}>{input}</li>
                ))}
              </ul>
            </div>

            <div className="mini-section">
              <h3>Workflow</h3>
              <ol className="steps">
                {selectedLoop.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="mini-section">
              <h3>Outputs</h3>
              <ul>
                {selectedLoop.outputs.map((output) => (
                  <li key={output}>{output}</li>
                ))}
              </ul>
            </div>

            <div className="mini-meta">
              <span>Source</span>
              <a href={selectedLoop.sourceUrl}>
                {selectedLoop.sourceName} / {selectedLoop.sourcePath}
              </a>
            </div>
            <pre className="markdown-recipe markdown-preview" aria-label="Source markdown preview">
              <code>{selectedLoop.markdown}</code>
            </pre>
            <Link className="primary wide detail-link" href={`/loops/${selectedLoop.id}`}>
              Open full loop page
            </Link>
          </aside>
        ) : null}
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
