import type { LoopSubmission } from "./submission-schema";

const sourceRepo = "loops-radar";

const typeLabels: Record<LoopSubmission["submissionType"], string> = {
  "submit-loop": "type:submit-loop",
  "request-loop": "type:request-loop",
  "improve-loop": "type:improve-loop",
};

const typeTitles: Record<LoopSubmission["submissionType"], string> = {
  "submit-loop": "Submit loop",
  "request-loop": "Request loop",
  "improve-loop": "Improve loop",
};

function compactTitle(input: string) {
  const singleLine = input.replace(/\s+/g, " ").trim();
  return singleLine.length > 78 ? `${singleLine.slice(0, 75)}...` : singleLine;
}

export function issueTitle(submission: LoopSubmission) {
  return `[loops-radar:${submission.submissionType}] ${compactTitle(submission.title)}`;
}

export function issueLabels(submission: LoopSubmission) {
  return [
    sourceRepo,
    `source-repo:${sourceRepo}`,
    "status:needs-triage",
    typeLabels[submission.submissionType],
    `visibility:${submission.visibility}`,
  ];
}

export function issueBody(submission: LoopSubmission) {
  const handle = submission.handle || "_Anonymous / not provided_";
  const context = submission.context || "_Not provided_";
  const visibility =
    submission.visibility === "private" ? "Private review issue" : "Public GitHub issue";

  return [
    "## Loops Radar submission",
    "",
    `**Type:** ${typeTitles[submission.submissionType]}`,
    `**Visibility:** ${visibility}`,
    `**Source repo:** ${sourceRepo}`,
    `**Handle:** ${handle}`,
    "",
    "## Title",
    "",
    submission.title,
    "",
    "## What this helps someone do",
    "",
    submission.outcome,
    "",
    "## Rough steps or idea",
    "",
    submission.steps,
    "",
    "## Link or context",
    "",
    context,
    "",
    "## Triage checklist",
    "",
    "- [ ] Check whether this is a duplicate or variation of an existing loop",
    "- [ ] Decide whether it belongs in the public catalog, private review, or backlog",
    "- [ ] Convert the rough idea into inputs, workflow, outputs, guardrails, and verifier",
    "- [ ] Add examples or receipts if it should be accepted",
  ].join("\n");
}

export async function createGitHubIssue(submission: LoopSubmission) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo =
    submission.visibility === "private"
      ? process.env.GITHUB_PRIVATE_REPO
      : process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    throw new Error("Missing GitHub issue environment configuration.");
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version":
          process.env.GITHUB_API_VERSION || "2022-11-28",
      },
      body: JSON.stringify({
        title: issueTitle(submission),
        body: issueBody(submission),
        labels: issueLabels(submission),
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub issue creation failed: ${response.status} ${body}`);
  }

  return (await response.json()) as { html_url: string; number: number };
}
