import { expect, test } from "@playwright/test";
import { loops } from "../lib/loops";

const detailPageSample = [
  "weekly-agent-loop-scan",
  "forward-future-overnight-docs-sweep",
  "awesome-agent-loops-kill-flaky-tests",
  "chaoyue-bug-hunting-loop",
  "cobus-patterns-changelog-drafter",
  "pi-pipelines-pipelines-automatic-loop",
  "agent-loop-patterns-patterns-metric-optimization-loop-readme",
  "invincible-prompts-automations",
  "millrace-src-millrace-ai-assets-execution-lad",
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
    await expect(
      page.getByRole("heading", { name: "Use Loops Radar in your coding agent.", level: 2 }),
    ).toBeVisible();
    await expect(page.getByText("daily or weekly loop digests")).toBeVisible();
    await expect(page.getByText("Recommended today")).toBeVisible();
    await expect(page.getByText("npx skills add georgewangyu/loops-radar")).toBeVisible();
    await expect(page.getByText("Created by George")).toBeVisible();
    await expect(page.getByLabel("George links").getByRole("link", { name: "Email" })).toHaveAttribute(
      "href",
      "mailto:hellogeorgehq@gmail.com",
    );
    await expect(page.getByLabel("George links").getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/snackoverflowgeorge/",
    );
    await expect(page.getByText(`${loops.length} matching loops`)).toBeVisible();
    await expect(page.getByText("showing 1-12")).toBeVisible();
    await expect(page.getByLabel("Sort")).toHaveValue("balanced");

    const firstPageSources = (await page.locator(".product-row .loop-kicker").allTextContents())
      .map((text) => text.split(" / ").at(-1) || text);
    expect(new Set(firstPageSources).size).toBeGreaterThan(4);
    expect(firstPageSources.every((item) => item === "GeorgeLoops")).toBe(false);

    await page.getByPlaceholder("Search loops...").fill("wono_strategy");
    await expect(
      page.getByRole("link", { name: "Monitor AI Warehouse and Wono" }),
    ).toBeVisible();
    await expect(page.getByText("1 matching loops")).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.getByRole("button", { name: "Goal recipe 1" }).click();
    await expect(page.getByText("Refactor Until Architecture Settles").first()).toBeVisible();
    await expect(page.getByText("1 matching loops")).toBeVisible();
    await page.getByRole("button", { name: "Goal recipe 1" }).click();
    await expect(page.getByText(`${loops.length} matching loops`)).toBeVisible();
    await expect(page.getByRole("button", { name: `All collections ${loops.length}` })).toBeVisible();

    await page.getByPlaceholder("Search loops...").fill("Weekly Agent Loop Scan");
    await expect(page.getByText("1 matching loops")).toBeVisible();
    const weeklyRow = page.locator("article", { hasText: "Weekly Agent Loop Scan" });
    await weeklyRow.getByRole("link", { name: /Weekly Agent Loop Scan/ }).click();
    await expect(page).toHaveURL(/\/loops\/weekly-agent-loop-scan$/);
    await expect(page.getByRole("heading", { name: "Weekly Agent Loop Scan", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Copyable Markdown", level: 2 })).toBeVisible();
    await expect(page.getByText("## Workflow")).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy markdown" })).toBeVisible();
  });

  test("pagination moves through the catalog and resets for search", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(`Page 1 of ${Math.ceil(loops.length / 12)}`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled();

    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("Page 2 of")).toBeVisible();
    await expect(page.getByText("showing 13-24")).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous" })).toBeEnabled();

    await page.getByPlaceholder("Search loops...").fill("wono_strategy");
    await expect(page.getByText("1 matching loops")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Monitor AI Warehouse and Wono" }),
    ).toBeVisible();
    await expect(page.getByText("Page 1 of")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0);
  });

  test("sort modes reorder the catalog", async ({ page }) => {
    await page.goto("/");

    const defaultFirstRow = await page.locator(".product-row").first().textContent();

    await page.getByLabel("Sort").selectOption("featured");
    await expect(page.locator(".sort-note")).toHaveText("Featured first");
    await expect(page.getByText("showing 1-12")).toBeVisible();

    await page.getByLabel("Sort").selectOption("title");
    await expect(page.locator(".sort-note")).toHaveText("A-Z");

    const titleFirstRow = await page.locator(".product-row").first().textContent();
    expect(titleFirstRow).not.toBe(defaultFirstRow);

    await page.getByLabel("Sort").selectOption("newest");
    await expect(page.locator(".sort-note")).toHaveText("Newest first");
  });

  test("copy button writes the visible source markdown", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");

    await page.getByRole("button", { name: "Copy loop" }).first().click();
    await expect(page.getByRole("button", { name: "Copied" }).first()).toBeVisible();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(loops.some((loop) => loop.markdown === clipboard)).toBe(true);
    expect(clipboard).toContain("---");
    expect(clipboard).toContain("# ");
  });

  test("setup command copies from the agent skill card", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");

    await page.getByRole("button", { name: "Copy command" }).click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe("npx skills add georgewangyu/loops-radar --skill loops-radar -g");
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

  test("contribution card links to the full submit form", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: "Open quick form" })).toHaveCount(0);
    await expect(page.locator(".quick-submit-form")).toHaveCount(0);
    await page.getByRole("link", { name: "Go to full form" }).click();

    await expect(page).toHaveURL(/#submit$/);
    await expect(page.getByRole("heading", { name: "Submit to Loops Radar" })).toBeVisible();
    await expect(page.getByLabel("Loop title")).toBeVisible();
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
    expect(sourceNames.has("Forward Future Loop Library")).toBe(true);
    expect(sourceNames.has("Awesome Agent Loops")).toBe(true);
    expect(sourceNames.has("Pi Pipelines")).toBe(true);
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
