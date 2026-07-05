import { NextRequest, NextResponse } from "next/server";
import { checkRadarLeadsHeartbeat } from "@/lib/radar-leads";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const rows = await checkRadarLeadsHeartbeat();
    return NextResponse.json({
      ok: true,
      checked: "radar_leads",
      sampleRows: rows.length,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Radar leads heartbeat failed." },
      { status: 500 },
    );
  }
}
