export type LoopStatus = "active" | "testing" | "reference" | "idea";

export type LoopCategory =
  | "Daily workflow"
  | "Repository ops"
  | "Content"
  | "Research"
  | "Meta systems"
  | "Goal recipe";

export type Loop = {
  id: string;
  name: string;
  category: LoopCategory;
  status: LoopStatus;
  cadence: string;
  summary: string;
  whyUseful: string;
  inputs: string[];
  steps: string[];
  outputs: string[];
  verifier: string;
  sourcePath: string;
};

export const loops: Loop[] = [
  {
    id: "daily-morning-routine",
    name: "Daily Morning Routine",
    category: "Daily workflow",
    status: "active",
    cadence: "daily 9 AM",
    summary:
      "Prepare the start-of-day journal, market radar, alerts, and ranked planning implications.",
    whyUseful:
      "Makes the day easier to choose by turning private context and public signals into a practical operating surface.",
    inputs: [
      "Current daily summary",
      "Morning brief helper output",
      "Market and builder signal sources",
      "Recent journal, calendar, health, and alert context",
    ],
    steps: [
      "Load journal routing instructions and establish the local date.",
      "Refresh daily summary and morning alerts.",
      "Run market radar across configured public sources.",
      "Route signals into ignition candidates, automations, content ideas, and project follow-ups.",
    ],
    outputs: [
      "Updated daily summary",
      "Morning brief with alerts and recommendations",
      "Ranked priorities for the day",
    ],
    verifier:
      "The summary has concrete morning context and the brief gives a ranked plan, not just a digest.",
    sourcePath: "GeorgeLoops/loops/daily-morning-routine/LOOP.md",
  },
  {
    id: "nightly-commit-and-push-review",
    name: "Nightly Commit and Push Review",
    category: "Repository ops",
    status: "active",
    cadence: "daily 9 PM",
    summary:
      "Review dirty workspace repositories, commit defensible local work, and push only gated autonomous candidates.",
    whyUseful:
      "Prevents useful work from piling up while keeping risky or ambiguous repo state out of bad commits.",
    inputs: [
      "Top-level workspace git repositories",
      "Dirty worktrees and unpushed commits",
      "Branch/upstream status",
      "Push/no-push routing rules",
    ],
    steps: [
      "Scan workspace repositories for staged, unstaged, untracked, and unpushed work.",
      "Group clearly related work into local commits only when defensible.",
      "Classify unpushed commits by publication readiness.",
      "Push only candidates that pass all unattended-publication gates.",
    ],
    outputs: [
      "Local commits for clear work",
      "Optional pushed autonomous candidates",
      "Nightly review report",
    ],
    verifier:
      "Clean work is committed or pushed with receipts, and risky work is explicitly left for owner review.",
    sourcePath: "GeorgeLoops/loops/nightly-commit-and-push-review/LOOP.md",
  },
  {
    id: "weekly-agent-loop-scan",
    name: "Weekly Agent Loop Scan",
    category: "Meta systems",
    status: "active",
    cadence: "weekly Saturday 9 AM",
    summary:
      "Find new high-signal loop candidates from recent work, commits, journals, and recurring friction.",
    whyUseful:
      "Turns repeated chaos into named maintenance systems instead of waiting for the workspace to feel messy.",
    inputs: [
      "Recent daily summaries",
      "Recent git changes",
      "Agent and knowledge artifacts",
      "Changed docs and scripts",
    ],
    steps: [
      "Review the last seven days of journal, git, and workflow changes.",
      "Identify up to five loop candidates.",
      "Attach evidence, risk, verifier, and smallest next action to each candidate.",
    ],
    outputs: ["Loop candidate shortlist", "Evidence and verifier for each candidate"],
    verifier:
      "At least one candidate is specific enough to approve or reject in under five minutes.",
    sourcePath: "GeorgeLoops/loops/weekly-agent-loop-scan/LOOP.md",
  },
  {
    id: "weekly-codex-automation-catalog-sync",
    name: "Weekly Codex Automation Catalog Sync",
    category: "Meta systems",
    status: "testing",
    cadence: "weekly Saturday 9 AM",
    summary:
      "Keep GeorgeLoops aligned with scheduled Codex automations and reusable goal recipes.",
    whyUseful:
      "Stops useful automation patterns from staying hidden in the app registry or recent chats.",
    inputs: [
      "Codex automation registry",
      "Recent automation creation/update records",
      "Recent goal-like prompts",
      "GeorgeLoops loops and goals catalog",
    ],
    steps: [
      "List current automations and new/changed scheduled work.",
      "Identify reusable unscheduled goal recipes.",
      "Compare source records against GeorgeLoops catalog.",
      "Add public-safe docs only when source evidence is complete.",
    ],
    outputs: ["GeorgeLoops doc updates", "Catalog sync report", "Public-safety scan result"],
    verifier:
      "Every new automation is represented, skipped, or listed as needing review with a reason.",
    sourcePath: "GeorgeLoops/loops/weekly-codex-automation-catalog-sync/LOOP.md",
  },
  {
    id: "cross-repo-pattern-propagation-scan",
    name: "Cross-Repo Pattern Propagation Scan",
    category: "Repository ops",
    status: "active",
    cadence: "weekly Saturday 9 AM",
    summary:
      "Find proven repo patterns that should be copied into other repositories.",
    whyUseful:
      "Prevents useful conventions from staying trapped in whichever repo happened to get attention first.",
    inputs: [
      "Top-level workspace repositories",
      "Recent changes",
      "Repo instructions, READMEs, visions, skills, scripts, and verifier conventions",
    ],
    steps: [
      "Identify recently changed source patterns.",
      "Decide whether each pattern looks proven.",
      "List candidate target repos, skips, and verifiers.",
    ],
    outputs: ["Cross-repo propagation shortlist"],
    verifier:
      "The report names source pattern, target repos, skipped repos, and concrete verification.",
    sourcePath: "GeorgeLoops/loops/cross-repo-pattern-propagation-scan/LOOP.md",
  },
  {
    id: "codex-thread-title-hygiene",
    name: "Codex Thread Title Hygiene",
    category: "Meta systems",
    status: "active",
    cadence: "daily noon",
    summary:
      "Review recent and pinned Codex threads and rename vague titles when a better title is high-confidence.",
    whyUseful:
      "Keeps durable work findable without over-reading or renaming stable threads.",
    inputs: ["Pinned thread list", "Recent thread list", "Thread previews", "Small samples when needed"],
    steps: [
      "Review recent and pinned thread title previews.",
      "Skip already-specific titles.",
      "Read small samples only for rename candidates.",
      "Rename only high-confidence vague or stale titles.",
    ],
    outputs: ["Renamed thread titles", "Hygiene report"],
    verifier:
      "Vague titles are reduced and already-good titles are skipped without unnecessary reads.",
    sourcePath: "GeorgeLoops/loops/codex-thread-title-hygiene/LOOP.md",
  },
  {
    id: "nightly-daily-workflow-social-draft-loop",
    name: "Nightly Daily Workflow Social Draft Loop",
    category: "Content",
    status: "testing",
    cadence: "daily 10 PM",
    summary:
      "Turn the day’s workflow signal into ranked LinkedIn/X candidate angles and local draft files.",
    whyUseful:
      "Catches useful thought while it is still fresh without taking public posting actions.",
    inputs: [
      "Current daily summary",
      "Same-day transcript/work artifacts",
      "Recent git work and local notes",
      "Market/research signal",
      "Social writing instructions",
    ],
    steps: [
      "Refresh end-of-day workflow context.",
      "Read objective signal and unresolved gaps.",
      "Produce two to four public-writing candidates.",
      "Draft the best one or two locally for review.",
    ],
    outputs: ["Candidate ranking", "Local draft files", "Review bundle"],
    verifier:
      "Drafts cite concrete source notes and remain public-safe for review.",
    sourcePath: "GeorgeLoops/loops/nightly-daily-workflow-social-draft-loop/LOOP.md",
  },
  {
    id: "thumbnail-iteration-loop",
    name: "Thumbnail Iteration Loop",
    category: "Content",
    status: "reference",
    cadence: "manual",
    summary:
      "Generate multiple thumbnail concepts, score them at small size, refine the strongest options, and preserve the final candidates.",
    whyUseful:
      "Turns visual taste into a repeatable loop: generate broadly, judge at real viewing size, then refine the few concepts that actually read.",
    inputs: [
      "Video topic or hook",
      "Source screenshots or proof assets",
      "Creator face or brand assets",
      "Thumbnail constraints and visual references",
    ],
    steps: [
      "Generate a broad batch of thumbnail concepts.",
      "Score each option at feed and YouTube-size legibility.",
      "Refine the top concepts with larger faces, clearer hooks, and accurate proof assets.",
      "Save final candidates and choose the safest high-clarity option.",
    ],
    outputs: [
      "Initial concept batch",
      "Refined top candidates",
      "Selected thumbnail recommendation",
      "Notes on why weaker options failed",
    ],
    verifier:
      "The selected option is readable at small size, accurate to the source material, and stronger than the first batch.",
    sourcePath: "GeorgeRepo journal milestone, 2026-06-21",
  },
  {
    id: "monitor-ai-warehouse-and-wono",
    name: "Monitor AI Warehouse and Wono",
    category: "Research",
    status: "testing",
    cadence: "weekly Saturday 9 AM",
    summary:
      "Watch selected creator sources for viral hook mechanics, strategy insights, and content ideas.",
    whyUseful:
      "Keeps creator research tied to reusable mechanics instead of passive watching.",
    inputs: [
      "Selected YouTube and X creator sources",
      "Video and text watchlists",
      "Source notes",
    ],
    steps: [
      "Check for new or high-signal posts since the last check.",
      "Extract reusable hook mechanics and strategy insights.",
      "Return watch-first links and one to three ideas.",
    ],
    outputs: ["Creator-watch brief", "Reusable hook mechanics", "Content ideas"],
    verifier:
      "The brief contains at least one reusable hook mechanic or plainly says nothing changed.",
    sourcePath: "GeorgeLoops/loops/monitor-ai-warehouse-and-wono/LOOP.md",
  },
  {
    id: "biweekly-sprint-retro-and-next-sprint-planning",
    name: "Biweekly Sprint Retro and Next Sprint Planning",
    category: "Daily workflow",
    status: "active",
    cadence: "every 2 weeks Sunday 8 PM",
    summary:
      "Close the current sprint with a retrospective and seed the next sprint’s operating surface.",
    whyUseful:
      "Makes sprint endings concrete without fabricating subjective reflections.",
    inputs: [
      "Daily summaries",
      "Sprint plans",
      "Metrics and allocation reports",
      "Open reflection questions",
    ],
    steps: [
      "Determine sprint window.",
      "Read plans, retros, daily summaries, and metrics.",
      "Draft or update retro and next-sprint planning sections.",
      "Add open questions instead of inventing subjective answers.",
    ],
    outputs: ["Sprint retro", "Next-sprint plan", "Review bundle"],
    verifier:
      "The run produces a reviewable retro, concrete next-sprint surface, and human questions.",
    sourcePath: "GeorgeLoops/loops/biweekly-sprint-retro-and-next-sprint-planning/LOOP.md",
  },
  {
    id: "refactor-until-architecture-settles",
    name: "Refactor Until Architecture Settles",
    category: "Goal recipe",
    status: "reference",
    cadence: "manual",
    summary:
      "Refactor a project or module until the architecture is coherent and the real UI/workflow is verified.",
    whyUseful:
      "Pairs architecture cleanup with durable progress tracking, live testing, and autoreview instead of a one-shot cleanup.",
    inputs: [
      "Target project or module",
      "Existing tests and manual verification path",
      "Important UI routes and states",
      "Repo-owned progress artifact path",
    ],
    steps: [
      "Record starting architecture in a progress artifact.",
      "Make one meaningful change at a time.",
      "Verify with tests and live app/browser checks after significant changes.",
      "Autoreview for regressions and leftover complexity.",
    ],
    outputs: ["Progress artifact", "Verified refactor diff", "Remaining risks"],
    verifier:
      "Architecture is simpler to explain, behavior checks pass, UI workflows are live-tested, and risks are explicit.",
    sourcePath: "GeorgeLoops/goals/refactor-until-architecture-settles/GOAL.md",
  },
];

export const categories = Array.from(new Set(loops.map((loop) => loop.category)));
export const statuses = Array.from(new Set(loops.map((loop) => loop.status)));

export function getLoopById(id: string) {
  return loops.find((loop) => loop.id === id);
}
