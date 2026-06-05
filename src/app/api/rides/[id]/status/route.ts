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
    const { status } = body;

    if (status !== "joined" && status !== "arrived") {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updatedParticipant = await dbParticipants.updateStatus(id, user.id, status);

    return NextResponse.json({
      message: "Status updated successfully",
      participant: updatedParticipant,
    });
  } catch (error: unknown) {
    console.error("Error updating participant status:", error);
    const message = error instanceof Error ? error.message : "Failed to update status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
