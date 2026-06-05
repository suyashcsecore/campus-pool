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
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    if (action === "join") {
      const participant = await dbParticipants.joinRide(id, user.id);
      return NextResponse.json({
        message: "Successfully joined the ride pool",
        participant,
      });
    } else if (action === "leave") {
      await dbParticipants.leaveRide(id, user.id);
      return NextResponse.json({
        message: "Successfully left the ride pool",
      });
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'join' or 'leave'" }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("Error with join/leave request:", error);
    const message = error instanceof Error ? error.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
