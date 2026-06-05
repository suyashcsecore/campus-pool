import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { dbMessages, dbParticipants } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: rideId } = await params;

    const participants = await dbParticipants.getByRideId(rideId);
    const isParticipant = participants.some((p) => p.userId === user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: "You must join this ride to view the chat" }, { status: 403 });
    }

    const messages = await dbMessages.getByRideId(rideId);
    return NextResponse.json({ messages });
  } catch (error: unknown) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json({ error: "Failed to fetch chat messages" }, { status: 500 });
  }
}

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
    const { content } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    const participants = await dbParticipants.getByRideId(rideId);
    const isParticipant = participants.some((p) => p.userId === user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: "You must join this ride to send messages" }, { status: 403 });
    }

    const message = await dbMessages.create(rideId, user.id, content.trim());
    return NextResponse.json({ message }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating chat message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
