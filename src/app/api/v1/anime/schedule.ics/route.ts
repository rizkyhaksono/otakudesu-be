import { NextResponse } from "next/server";
import schedule from "@/utils/anime/schedule";
import { scheduleToIcs } from "@/lib/anime/ics";
import { getSiteUrl } from "@/lib/shared/env";
import { toErrorResponse } from "@/lib/shared/apiHandler";

/**
 * A subscribable calendar feed — add this URL once in Google/Apple Calendar
 * and the app itself keeps it in sync, rather than a user having to remember
 * to check the schedule page.
 */
export async function GET() {
  try {
    const days = await schedule();
    const ics = scheduleToIcs(days, getSiteUrl());

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="jadwal-anime.ics"',
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
