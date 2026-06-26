import { NextResponse } from "next/server";
import { getJobById } from "@/lib/jobs";
import type { ApiDetailResponse } from "@/types/search";
import type { JobDetail } from "@/types/job";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse<ApiDetailResponse<JobDetail>>> {
  try {
    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ ok: false, data: null, error: "Job ID is required." }, { status: 400 });
    }

    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ ok: false, data: null, error: "Job not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: job });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load job.";
    console.error("[api/jobs/[jobId]]", err);
    return NextResponse.json({ ok: false, data: null, error: message }, { status: 500 });
  }
}
