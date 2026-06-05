import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { dbParticipants } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: rideId } = await params;
    const body = await req.json();
    const { reportedUserId } = body;

    if (!reportedUserId) {
      return NextResponse.json({ error: "Reported user ID is required" }, { status: 400 });
    }

    if (user.id === reportedUserId) {
      return NextResponse.json({ error: "You cannot report yourself" }, { status: 400 });
    }

    const result = await dbParticipants.reportNoShow(rideId, user.id, reportedUserId);

    return NextResponse.json({
      message: result.penalized
        ? `No-show confirmed. ${result.reportedUserName}'s trust score has been lowered.`
        : "Report recorded. Waiting for other riders to verify.",
      penalized: result.penalized,
      reportsCount: result.reportsCount,
      threshold: result.threshold,
      reportedUserScore: result.reportedUserScore,
    });
  } catch (error: unknown) {
    console.error("Error reporting no-show:", error);
    const message = error instanceof Error ? error.message : "Failed to process report";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
