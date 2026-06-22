import { expect, test } from "@playwright/test";
import { loops } from "../lib/loops";

const detailPageSample = [
  "weekly-agent-loop-scan",
  "anthropic-web-artifacts-builder",
  "addy-code-review-and-quality",
  "superpowers-brainstorming",
  "vercel-deploy-to-vercel",
  "pm-pm-execution-sprint-plan",
  "dimillian-review-and-simplify-changes",
  "markdown-viewer-infographic",
  "last30days-last30days",
]
  .map((id) => loops.find((loop) => loop.id === id))
  .filter((loop): loop is (typeof loops)[number] => Boolean(loop));

test.describe("Loops Radar catalog", () => {
  test("catalog controls, preview buttons, and loop links work", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("Loops Radar");
    await expect(page.getByRole("heading", { name: "Loops Radar", level: 1 })).toBeVisible();
    await expect(page.getByText("public markdown sources")).toBeVisible();
    await expect(page.getByText(`${loops.length} matching loops`)).toBeVisible();

    await page.getByPlaceholder("Search loops...").fill("wono_strategy");
    await expect(page.getByText("Monitor AI Warehouse and Wono")).toBeVisible();
    await expect(page.getByText("1 matching loops")).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.getByRole("button", { name: "Goal recipe 1" }).click();
    await expect(page.getByText("Refactor Until Architecture Settles").first()).toBeVisible();
    await expect(page.getByText("1 matching loops")).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    const weeklyRow = page.locator("article", { hasText: "Weekly Agent Loop Scan" });
    await weeklyRow.getByRole("button", { name: "Preview" }).click();
    await expect(page.getByRole("heading", { name: "Weekly Agent Loop Scan", level: 2 })).toBeVisible();

    await weeklyRow.getByRole("link", { name: /Weekly Agent Loop Scan/ }).click();
    await expect(page).toHaveURL(/\/loops\/weekly-agent-loop-scan$/);
    await expect(page.getByRole("heading", { name: "Weekly Agent Loop Scan", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Copyable Markdown", level: 2 })).toBeVisible();
    await expect(page.getByText("## Workflow")).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy markdown" })).toBeVisible();
  });

  test("copy button writes the source GeorgeLoops markdown", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");

    await page.getByRole("button", { name: "Copy" }).first().click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(loops[0].markdown);
    expect(clipboard).toContain("---");
    expect(clipboard).toContain(`# ${loops[0].name}`);
  });

  test("submit form defaults to public issue route and shows success", async ({ page }) => {
    const payloads: Array<Record<string, unknown>> = [];

    await page.route("**/api/submit", async (route) => {
      payloads.push(JSON.parse(route.request().postData() || "{}") as Record<string, unknown>);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          issueNumber: 42,
          issueUrl: "https://github.com/example/repo/issues/42",
        }),
      });
    });

    await page.goto("/");
    await page.getByRole("link", { name: "Submit loop" }).click();
    await page.getByLabel("Loop title").fill("Browser proof loop");
    await page
      .getByLabel("What does this help someone do?")
      .fill("It helps builders verify real UI paths before declaring frontend work done.");
    await page
      .getByLabel("Rough steps")
      .fill("Open the app, use filters, open a loop page, submit a mocked issue, and check mobile.");
    await page.getByRole("button", { name: "Create issue" }).click();

    await expect(page.getByText("Submission sent.")).toBeVisible();
    expect(payloads[0]?.visibility).toBe("public");
    expect(payloads[0]?.submissionType).toBe("submit-loop");
  });

  test("mobile layout has no horizontal overflow", async ({ page }) => {
    await page.goto("/");

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
    await expect(page.getByRole("link", { name: "Submit loop" })).toBeVisible();
  });
});

test.describe("Loop detail pages", () => {
  for (const loop of detailPageSample) {
    test(`renders ${loop.id}`, async ({ page }) => {
      await page.goto(`/loops/${loop.id}`);

      await expect(page.getByRole("heading", { name: loop.name, level: 1 })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Copyable Markdown", level: 2 })).toBeVisible();
      await expect(page.getByRole("link", { name: new RegExp(loop.sourceName) })).toBeVisible();
      await expect(page.locator(".markdown-recipe code")).toContainText(
        loop.markdown
          .split("\n")
          .find((line) => line.startsWith("# ") || line.length > 12) || loop.name,
      );
    });
  }

  test("sample contains multiple synced public sources", () => {
    const sourceNames = new Set(loops.map((loop) => loop.sourceName));

    expect(sourceNames.has("GeorgeLoops")).toBe(true);
    expect(sourceNames.has("Anthropic Skills")).toBe(true);
    expect(sourceNames.has("Addy Osmani Agent Skills")).toBe(true);
    expect(sourceNames.size).toBeGreaterThanOrEqual(5);
    expect(new Set(loops.map((loop) => loop.id)).size).toBe(loops.length);
  });

  test("detail page copy button writes source markdown", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const loop = loops.find((item) => item.id === "weekly-agent-loop-scan") || loops[0];

    await page.goto(`/loops/${loop.id}`);
    await page.getByRole("button", { name: "Copy markdown" }).click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(loop.markdown);
  });

  test("detail page navigation returns to catalog and submit form", async ({ page }) => {
    await page.goto("/loops/weekly-agent-loop-scan");

    await page.getByRole("link", { name: "Catalog" }).click();
    await expect(page).toHaveURL("/");
    await page.goto("/loops/weekly-agent-loop-scan");
    await page.getByRole("link", { name: "Submit loop" }).click();
    await expect(page).toHaveURL(/\/#submit$/);
    await expect(page.getByRole("heading", { name: "Submit to Loops Radar" })).toBeVisible();
  });
});
