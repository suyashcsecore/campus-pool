import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { dbRides, dbParticipants, dbMessages } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ride = await dbRides.getById(id);
    if (!ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    const participants = await dbParticipants.getByRideId(id);
    const messages = await dbMessages.getByRideId(id);

    return NextResponse.json({
      ride: {
        ...ride,
        participants,
        messages,
        availableSpots: ride.maxPoolSize - participants.length,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching ride detail:", error);
    return NextResponse.json({ error: "Failed to fetch ride details" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const ride = await dbRides.getById(id);
    if (!ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    if (ride.creatorId !== user.id) {
      return NextResponse.json(
        { error: "Only the ride creator can modify the ride status" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status } = body;

    if (status !== "completed" && status !== "cancelled") {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updatedRide = await dbRides.updateStatus(id, status);
    return NextResponse.json({
      message: `Ride marked as ${status} successfully`,
      ride: updatedRide,
    });
  } catch (error: unknown) {
    console.error("Error updating ride status:", error);
    return NextResponse.json({ error: "Failed to update ride status" }, { status: 500 });
  }
}
