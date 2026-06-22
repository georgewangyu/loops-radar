import Link from "next/link";
import { notFound } from "next/navigation";
import { getLoopById, loops } from "@/lib/loops";
import { CopyMarkdownButton } from "./copy-markdown-button";

type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return loops.map((loop) => ({ id: loop.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const loop = getLoopById(id);

  if (!loop) {
    return {
      title: "Loop not found | Loops Radar",
    };
  }

  return {
    title: `${loop.name} | Loops Radar`,
    description: loop.summary,
  };
}

export default async function LoopPage({ params }: Props) {
  const { id } = await params;
  const loop = getLoopById(id);

  if (!loop) {
    notFound();
  }

  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="mark">LR</span>
          <span>Loops Radar</span>
        </Link>
        <nav className="nav-pills" aria-label="Loop page navigation">
          <Link href="/">Catalog</Link>
          <Link href="/#submit">Submit</Link>
        </nav>
        <Link className="primary nav-submit" href="/#submit">
          Submit loop
        </Link>
      </header>

      <article className="loop-page">
        <section className="loop-page-hero">
          <div>
            <p className="eyebrow">{loop.category}</p>
            <h1>{loop.name}</h1>
            <p className="hero-copy">{loop.summary}</p>
          </div>
          <aside className="loop-page-meta">
            <span className={`status status-${loop.status}`}>{loop.status}</span>
            <div className="mini-meta">
              <span>Cadence</span>
              <strong>{loop.cadence}</strong>
            </div>
            <div className="mini-meta">
              <span>Source</span>
              <a href={loop.sourceUrl}>
                {loop.sourceName} / {loop.sourcePath}
              </a>
            </div>
          </aside>
        </section>

        <section className="loop-page-section markdown-section">
          <div className="markdown-heading">
            <div>
              <p className="eyebrow">Source recipe</p>
              <h2>Copyable Markdown</h2>
            </div>
            <CopyMarkdownButton markdown={loop.markdown} />
          </div>
          <pre className="markdown-recipe">
            <code>{loop.markdown}</code>
          </pre>
        </section>
      </article>
    </main>
  );
}
