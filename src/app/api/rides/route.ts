import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { dbRides, dbParticipants, seedMockData } from "@/lib/db";

export async function GET(req: NextRequest) {
  await seedMockData();

  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get("source");
    const destination = searchParams.get("destination");
    const date = searchParams.get("date");

    let rides = await dbRides.getAll();

    let ridesWithParticipants = await Promise.all(
      rides.map(async (ride) => {
        const participants = await dbParticipants.getByRideId(ride.id);
        return {
          ...ride,
          participants,
          availableSpots: ride.maxPoolSize - participants.length,
        };
      })
    );

    if (source) {
      const srcQuery = source.toLowerCase();
      ridesWithParticipants = ridesWithParticipants.filter((r) =>
        r.source.toLowerCase().includes(srcQuery)
      );
    }

    if (destination) {
      const destQuery = destination.toLowerCase();
      ridesWithParticipants = ridesWithParticipants.filter((r) =>
        r.destination.toLowerCase().includes(destQuery)
      );
    }

    if (date) {
      ridesWithParticipants = ridesWithParticipants.filter((r) => {
        const rideDate = new Date(r.departureTime).toISOString().split("T")[0];
        return rideDate === date;
      });
    }

    ridesWithParticipants.sort(
      (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    );

    return NextResponse.json({ rides: ridesWithParticipants });
  } catch (error: unknown) {
    console.error("Error fetching rides:", error);
    return NextResponse.json({ error: "Failed to fetch rides" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { source, destination, departureTime, maxPoolSize, estimatedFare, description } = body;

    if (!source || !destination || !departureTime || !maxPoolSize) {
      return NextResponse.json(
        { error: "Source, destination, departure time, and pool size are required" },
        { status: 400 }
      );
    }

    const poolSize = parseInt(maxPoolSize);
    if (isNaN(poolSize) || poolSize < 2 || poolSize > 6) {
      return NextResponse.json(
        { error: "Pool size must be a number between 2 and 6" },
        { status: 400 }
      );
    }

    const fare = parseFloat(estimatedFare) || 0;

    const departureDate = new Date(departureTime);
    if (isNaN(departureDate.getTime()) || departureDate.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Departure time must be a valid date in the future" },
        { status: 400 }
      );
    }

    const { ride, participant } = await dbRides.create(
      {
        source,
        destination,
        departureTime: departureDate.toISOString(),
        maxPoolSize: poolSize,
        estimatedFare: fare,
        description: description || "",
      },
      user.id
    );

    return NextResponse.json(
      {
        message: "Ride created successfully",
        ride: {
          ...ride,
          participants: [participant],
          availableSpots: ride.maxPoolSize - 1,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating ride:", error);
    const message = error instanceof Error ? error.message : "Failed to create ride";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
