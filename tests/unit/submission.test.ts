import { describe, expect, test } from "vitest";
import { issueBody, issueLabels, issueTitle } from "@/lib/github-issue";
import { loopSubmissionSchema, type LoopSubmission } from "@/lib/submission-schema";

function parsed(overrides: Record<string, unknown> = {}): LoopSubmission {
  return loopSubmissionSchema.parse({
    submissionType: "request-loop",
    title: "  Weekly inbox zero sweep  ",
    outcome: "Clears the backlog every Friday.",
    steps: "Triage, archive, then reply in batches.",
    ...overrides,
  });
}

describe("loopSubmissionSchema", () => {
  test("trims fields and defaults visibility, context, handle and honeypot", () => {
    expect(parsed()).toEqual({
      submissionType: "request-loop",
      visibility: "public",
      title: "Weekly inbox zero sweep",
      outcome: "Clears the backlog every Friday.",
      steps: "Triage, archive, then reply in batches.",
      context: "",
      handle: "",
      website: "",
    });
  });

  test("reports type, length and honeypot violations by field", () => {
    const result = loopSubmissionSchema.safeParse({
      submissionType: "hack",
      title: "x",
      outcome: "short",
      steps: "short",
      context: "c".repeat(1001),
      handle: "h".repeat(121),
      website: "bot",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(Object.keys(result.error.flatten().fieldErrors).sort()).toEqual(
      ["context", "handle", "outcome", "steps", "submissionType", "title", "website"],
    );
  });
});

describe("issue formatting", () => {
  test("title is prefixed by type and compacted to 78 chars", () => {
    const title = issueTitle(parsed({ title: "word ".repeat(20) }));
    expect(title.startsWith("[loops-radar:request-loop] ")).toBe(true);
    expect(title.endsWith("...")).toBe(true);
    expect(title.length).toBe("[loops-radar:request-loop] ".length + 78);
  });

  test("labels carry repo, triage, type and visibility", () => {
    expect(issueLabels(parsed({ visibility: "private" }))).toEqual([
      "loops-radar",
      "source-repo:loops-radar",
      "status:needs-triage",
      "type:request-loop",
      "visibility:private",
    ]);
  });

  test("body shows placeholders for missing handle and context", () => {
    const body = issueBody(parsed());
    expect(body).toContain("**Type:** Request loop");
    expect(body).toContain("**Handle:** _Anonymous / not provided_");
    expect(body).toContain("## Link or context\n\n_Not provided_");
    expect(body).toContain("## Title\n\nWeekly inbox zero sweep");
    expect(body).toContain("## Rough steps or idea\n\nTriage, archive, then reply in batches.");
    expect(body).toContain("**Visibility:** Public GitHub issue");
  });
});
