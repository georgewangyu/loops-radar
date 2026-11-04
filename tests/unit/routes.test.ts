import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GET as getHeartbeat } from "@/app/api/cron/radar-leads-heartbeat/route";
import { POST as postLead } from "@/app/api/leads/route";
import { POST as postSubmit } from "@/app/api/submit/route";
import { issueBody } from "@/lib/github-issue";
import { loopSubmissionSchema } from "@/lib/submission-schema";

const submission = {
  submissionType: "submit-loop",
  visibility: "public",
  title: "Weekly inbox zero sweep",
  outcome: "Clears the backlog every Friday.",
  steps: "Triage, archive, then reply in batches.",
};

function jsonRequest(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://radar.example${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  for (const name of [
    "GITHUB_TOKEN",
    "GITHUB_OWNER",
    "GITHUB_REPO",
    "GITHUB_PRIVATE_REPO",
    "GITHUB_API_VERSION",
    "LOOPS_REQUEST_ALLOWED_ORIGIN",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "CRON_SECRET",
  ]) {
    vi.stubEnv(name, "");
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/submit", () => {
  test("creates a GitHub issue in the public repo and returns its number", async () => {
    vi.stubEnv("GITHUB_TOKEN", "token");
    vi.stubEnv("GITHUB_OWNER", "owner");
    vi.stubEnv("GITHUB_REPO", "public-repo");
    const fetchMock = stubFetch(
      Response.json({ number: 7, html_url: "https://github.com/owner/public-repo/issues/7" }),
    );

    const response = await postSubmit(jsonRequest("/api/submit", submission));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      issueNumber: 7,
      issueUrl: "https://github.com/owner/public-repo/issues/7",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.github.com/repos/owner/public-repo/issues");
    expect(init.method).toBe("POST");
    expect(init.headers.Accept).toBe("application/vnd.github+json");
    expect(init.headers.Authorization).toBe("Bearer token");
    expect(init.headers["X-GitHub-Api-Version"]).toBe("2022-11-28");
    const body = JSON.parse(init.body);
    expect(body.body).toBe(issueBody(loopSubmissionSchema.parse(submission)));
    expect(body.title).toBe("[loops-radar:submit-loop] Weekly inbox zero sweep");
    expect(body.labels).toContain("visibility:public");
  });

  test("private submissions go to the private repo", async () => {
    vi.stubEnv("GITHUB_TOKEN", "token");
    vi.stubEnv("GITHUB_OWNER", "owner");
    vi.stubEnv("GITHUB_PRIVATE_REPO", "private-repo");
    const fetchMock = stubFetch(Response.json({ number: 1, html_url: "u" }));

    const response = await postSubmit(
      jsonRequest("/api/submit", { ...submission, visibility: "private" }),
    );

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.github.com/repos/owner/private-repo/issues",
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).labels).toContain("visibility:private");
  });

  test.each([
    ["a filled honeypot", { ...submission, website: "bot" }],
    ["a too-short title", { ...submission, title: "x" }],
    ["missing rough steps", { ...submission, steps: "" }],
    ["an unknown submission type", { ...submission, submissionType: "hack" }],
    ["malformed json", "{not json"],
  ])("rejects %s with 400 and never calls GitHub", async (_label, body) => {
    const fetchMock = stubFetch(Response.json({}));

    const response = await postSubmit(jsonRequest("/api/submit", body));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Invalid submission.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("a configured origin rejects other origins but allows a missing Origin header", async () => {
    vi.stubEnv("LOOPS_REQUEST_ALLOWED_ORIGIN", "https://radar.example");
    const fetchMock = stubFetch(Response.json({}));

    const foreign = await postSubmit(
      jsonRequest("/api/submit", submission, { Origin: "https://evil.example" }),
    );
    const noOrigin = await postSubmit(jsonRequest("/api/submit", { ...submission, title: "x" }));

    expect(foreign.status).toBe(403);
    expect(noOrigin.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("a matching origin reaches GitHub", async () => {
    vi.stubEnv("LOOPS_REQUEST_ALLOWED_ORIGIN", "https://radar.example");
    vi.stubEnv("GITHUB_TOKEN", "token");
    vi.stubEnv("GITHUB_OWNER", "owner");
    vi.stubEnv("GITHUB_REPO", "public-repo");
    const fetchMock = stubFetch(Response.json({ number: 2, html_url: "u" }));

    const response = await postSubmit(
      jsonRequest("/api/submit", submission, { Origin: "https://radar.example" }),
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("missing GitHub config returns a generic 500 without calling GitHub", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = stubFetch(Response.json({}));

    const response = await postSubmit(jsonRequest("/api/submit", submission));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Could not create loop submission." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("a network error reaching GitHub returns a generic 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("GITHUB_TOKEN", "token");
    vi.stubEnv("GITHUB_OWNER", "owner");
    vi.stubEnv("GITHUB_REPO", "public-repo");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const response = await postSubmit(jsonRequest("/api/submit", submission));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Could not create loop submission." });
  });

  test("a GitHub failure returns a generic 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("GITHUB_TOKEN", "token");
    vi.stubEnv("GITHUB_OWNER", "owner");
    vi.stubEnv("GITHUB_REPO", "public-repo");
    const fetchMock = stubFetch(new Response("boom", { status: 502 }));

    const response = await postSubmit(jsonRequest("/api/submit", submission));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Could not create loop submission." });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("POST /api/leads", () => {
  test("upserts the lead into Supabase with consent and request metadata", async () => {
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co/");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    const fetchMock = stubFetch(new Response(null, { status: 201 }));

    const response = await postLead(
      jsonRequest(
        "/api/leads",
        { email: " Reader@Example.com ", name: " Ada " },
        { Referer: "https://radar.example/", "User-Agent": "test-agent" },
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://project.supabase.co/rest/v1/radar_leads?on_conflict=product,email",
    );
    expect(init.method).toBe("POST");
    expect(init.headers.apikey).toBe("service-key");
    expect(init.headers.Authorization).toBe("Bearer service-key");
    expect(init.headers.Prefer).toBe("resolution=merge-duplicates");
    expect(JSON.parse(init.body)).toMatchObject({
      email: "reader@example.com",
      name: "Ada",
      product: "loops-radar",
      source: "website-install-gate",
      consent_updates: true,
      install_command_revealed: true,
      repo_url: "https://github.com/georgewangyu/loops-radar",
      referrer: "https://radar.example/",
      user_agent: "test-agent",
    });
  });

  test.each([
    ["a filled honeypot", { email: "a@b.co", name: "Ada", website: "bot" }],
    ["an invalid email", { email: "nope", name: "Ada" }],
    ["a missing name", { email: "a@b.co" }],
  ])("rejects %s with 400 and never calls Supabase", async (_label, body) => {
    const fetchMock = stubFetch(new Response(null));

    const response = await postLead(jsonRequest("/api/leads", body));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Invalid lead.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("a Supabase error returns a generic 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    const fetchMock = stubFetch(new Response("conflict", { status: 409 }));

    const response = await postLead(jsonRequest("/api/leads", { email: "a@b.co", name: "Ada" }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Could not save lead." });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("a network error reaching Supabase returns a generic 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const response = await postLead(jsonRequest("/api/leads", { email: "a@b.co", name: "Ada" }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Could not save lead." });
  });

  test("missing Supabase config returns a generic 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const fetchMock = stubFetch(new Response(null));

    const response = await postLead(jsonRequest("/api/leads", { email: "a@b.co", name: "Ada" }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Could not save lead." });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/cron/radar-leads-heartbeat", () => {
  function heartbeatRequest(authorization?: string) {
    return new NextRequest("https://radar.example/api/cron/radar-leads-heartbeat", {
      headers: authorization ? { Authorization: authorization } : {},
    });
  }

  test.each([
    ["no secret configured", "", "Bearer anything"],
    ["a missing header", "cron-secret", undefined],
    ["a wrong secret", "cron-secret", "Bearer wrong"],
  ])("returns 401 with %s and never calls Supabase", async (_label, secret, authorization) => {
    vi.stubEnv("CRON_SECRET", secret);
    const fetchMock = stubFetch(Response.json([]));

    const response = await getHeartbeat(heartbeatRequest(authorization));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("reads one radar_leads row with the service key", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co/");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    const fetchMock = stubFetch(Response.json([{ product: "loops-radar" }]));

    const response = await getHeartbeat(heartbeatRequest("Bearer cron-secret"));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, checked: "radar_leads", sampleRows: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://project.supabase.co/rest/v1/radar_leads?select=product&limit=1");
    expect(init.method).toBe("GET");
    expect(init.headers.apikey).toBe("service-key");
  });

  test("a Supabase error returns a generic 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    const fetchMock = stubFetch(new Response("down", { status: 503 }));

    const response = await getHeartbeat(heartbeatRequest("Bearer cron-secret"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Radar leads heartbeat failed." });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
