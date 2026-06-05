import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "./supabase/server";
import type { Message, Ride, RideParticipant, User } from "./types";
import { generateId, mapMessage, mapParticipant, mapRide, mapUser } from "./mappers";

export type { User, Ride, RideParticipant, Message } from "./types";

async function syncTrustScore(userId: string, newScore: number, incrementNoShows: boolean) {
  const supabase = getSupabaseAdmin();
  const userUpdate: Record<string, unknown> = { trust_score: newScore };
  if (incrementNoShows) {
    const { data: user } = await supabase.from("users").select("no_shows_count").eq("id", userId).single();
    userUpdate.no_shows_count = ((user?.no_shows_count as number) || 0) + 1;
  }
  await supabase.from("users").update(userUpdate).eq("id", userId);
  await supabase.from("participants").update({ user_trust_score: newScore }).eq("user_id", userId);
  await supabase.from("rides").update({ creator_trust_score: newScore }).eq("creator_id", userId);
}

export const supabaseDbUsers = {
  getAll: async () => {
    const { data, error } = await getSupabaseAdmin().from("users").select("*");
    if (error) throw error;
    return (data || []).map(mapUser);
  },
  getById: async (id: string) => {
    const { data, error } = await getSupabaseAdmin().from("users").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapUser(data) : undefined;
  },
  getByEmail: async (email: string) => {
    const { data, error } = await getSupabaseAdmin()
      .from("users")
      .select("*")
      .ilike("email", email)
      .maybeSingle();
    if (error) throw error;
    return data ? mapUser(data) : undefined;
  },
  create: async (
    user: Omit<User, "id" | "trustScore" | "completedRidesCount" | "noShowsCount" | "joinedAt">
  ) => {
    const existing = await supabaseDbUsers.getByEmail(user.email);
    if (existing) throw new Error("User with this email already exists");
    const passwordHash = await bcrypt.hash(user.passwordHash, 10);
    const row = {
      id: generateId(),
      email: user.email.toLowerCase(),
      password_hash: passwordHash,
      name: user.name,
      phone: user.phone,
      trust_score: 100,
      completed_rides_count: 0,
      no_shows_count: 0,
      joined_at: new Date().toISOString(),
    };
    const { data, error } = await getSupabaseAdmin().from("users").insert(row).select("*").single();
    if (error) throw error;
    return mapUser(data);
  },
  updateTrustScore: async (userId: string, penalty: number) => {
    const user = await supabaseDbUsers.getById(userId);
    if (!user) return undefined;
    const newScore = Math.max(0, Math.min(100, user.trustScore - penalty));
    await syncTrustScore(userId, newScore, penalty > 0);
    return { ...user, trustScore: newScore, noShowsCount: penalty > 0 ? user.noShowsCount + 1 : user.noShowsCount };
  },
};

export const supabaseDbRides = {
  getAll: async () => {
    const { data, error } = await getSupabaseAdmin().from("rides").select("*");
    if (error) throw error;
    return (data || []).map(mapRide);
  },
  getById: async (id: string) => {
    const { data, error } = await getSupabaseAdmin().from("rides").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapRide(data) : undefined;
  },
  create: async (
    ride: Omit<Ride, "id" | "creatorId" | "status" | "createdAt" | "creatorName" | "creatorTrustScore">,
    creatorId: string
  ) => {
    const creator = await supabaseDbUsers.getById(creatorId);
    if (!creator) throw new Error("Creator user not found");
    const rideId = generateId();
    const rideRow = {
      id: rideId,
      creator_id: creatorId,
      creator_name: creator.name,
      creator_trust_score: creator.trustScore,
      source: ride.source,
      destination: ride.destination,
      departure_time: ride.departureTime,
      max_pool_size: ride.maxPoolSize,
      estimated_fare: ride.estimatedFare,
      status: "active",
      description: ride.description,
      created_at: new Date().toISOString(),
    };
    const participantRow = {
      id: generateId(),
      ride_id: rideId,
      user_id: creator.id,
      user_name: creator.name,
      user_email: creator.email,
      user_phone: creator.phone,
      user_trust_score: creator.trustScore,
      status: "joined",
      joined_at: new Date().toISOString(),
      reported_by: [],
    };
    const supabase = getSupabaseAdmin();
    const { data: rideData, error: rideError } = await supabase.from("rides").insert(rideRow).select("*").single();
    if (rideError) throw rideError;
    const { data: partData, error: partError } = await supabase
      .from("participants")
      .insert(participantRow)
      .select("*")
      .single();
    if (partError) throw partError;
    return { ride: mapRide(rideData), participant: mapParticipant(partData) };
  },
  updateStatus: async (rideId: string, status: "completed" | "cancelled") => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("rides")
      .update({ status })
      .eq("id", rideId)
      .select("*")
      .single();
    if (error) throw error;
    if (status === "completed") {
      const { data: participants } = await supabase
        .from("participants")
        .select("*")
        .eq("ride_id", rideId)
        .in("status", ["completed", "arrived", "joined"]);
      for (const p of participants || []) {
        await supabase.from("participants").update({ status: "completed" }).eq("id", p.id);
        const { data: user } = await supabase.from("users").select("completed_rides_count").eq("id", p.user_id).single();
        await supabase
          .from("users")
          .update({ completed_rides_count: ((user?.completed_rides_count as number) || 0) + 1 })
          .eq("id", p.user_id);
      }
    }
    return mapRide(data);
  },
};

export const supabaseDbParticipants = {
  getByRideId: async (rideId: string) => {
    const { data, error } = await getSupabaseAdmin()
      .from("participants")
      .select("*")
      .eq("ride_id", rideId)
      .order("joined_at", { ascending: true });
    if (error) throw error;
    return (data || []).map(mapParticipant);
  },
  joinRide: async (rideId: string, userId: string) => {
    const ride = await supabaseDbRides.getById(rideId);
    if (!ride) throw new Error("Ride not found");
    if (ride.status !== "active") throw new Error("Ride is no longer active");
    const existing = (await supabaseDbParticipants.getByRideId(rideId)).find((p) => p.userId === userId);
    if (existing) throw new Error("User has already joined this ride");
    const currentCount = (await supabaseDbParticipants.getByRideId(rideId)).length;
    if (currentCount >= ride.maxPoolSize) throw new Error("Ride pool is full");
    const user = await supabaseDbUsers.getById(userId);
    if (!user) throw new Error("User not found");
    const row = {
      id: generateId(),
      ride_id: rideId,
      user_id: userId,
      user_name: user.name,
      user_email: user.email,
      user_phone: user.phone,
      user_trust_score: user.trustScore,
      status: "joined",
      joined_at: new Date().toISOString(),
      reported_by: [],
    };
    const { data, error } = await getSupabaseAdmin().from("participants").insert(row).select("*").single();
    if (error) throw error;
    return mapParticipant(data);
  },
  leaveRide: async (rideId: string, userId: string) => {
    const ride = await supabaseDbRides.getById(rideId);
    if (!ride) throw new Error("Ride not found");
    if (ride.creatorId === userId) throw new Error("Creator cannot leave the ride. Cancel the ride instead.");
    const { data, error } = await getSupabaseAdmin()
      .from("participants")
      .delete()
      .eq("ride_id", rideId)
      .eq("user_id", userId)
      .select("*");
    if (error) throw error;
    if (!data?.length) throw new Error("Participant not found");
    return true;
  },
  updateStatus: async (rideId: string, userId: string, status: RideParticipant["status"]) => {
    const { data, error } = await getSupabaseAdmin()
      .from("participants")
      .update({ status })
      .eq("ride_id", rideId)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw error;
    return mapParticipant(data);
  },
  reportNoShow: async (rideId: string, reporterId: string, reportedUserId: string) => {
    const participants = await supabaseDbParticipants.getByRideId(rideId);
    const reporterPart = participants.find((p) => p.userId === reporterId);
    const reportedPart = participants.find((p) => p.userId === reportedUserId);
    if (!reporterPart) throw new Error("You are not a participant in this ride");
    if (!reportedPart) throw new Error("Reported user is not a participant in this ride");
    if (reportedPart.status === "noshow") throw new Error("User is already flagged as a no-show");
    const reportedBy = [...(reportedPart.reportedBy || [])];
    if (reportedBy.includes(reporterId)) throw new Error("You have already reported this user");
    reportedBy.push(reporterId);
    const otherCount = participants.length - 1;
    const threshold = Math.max(1, Math.floor(otherCount / 2) + 1);
    let penalized = false;
    let newScore = reportedPart.userTrustScore;
    let updatePayload: Record<string, unknown> = { reported_by: reportedBy };
    if (reportedBy.length >= threshold) {
      updatePayload.status = "noshow";
      const reportedUser = await supabaseDbUsers.getById(reportedUserId);
      if (reportedUser) {
        newScore = Math.max(0, reportedUser.trustScore - 15);
        await syncTrustScore(reportedUserId, newScore, true);
      }
      penalized = true;
    } else {
      await getSupabaseAdmin()
        .from("participants")
        .update({ reported_by: reportedBy })
        .eq("ride_id", rideId)
        .eq("user_id", reportedUserId);
    }
    if (penalized) {
      await getSupabaseAdmin()
        .from("participants")
        .update(updatePayload)
        .eq("ride_id", rideId)
        .eq("user_id", reportedUserId);
    }
    return {
      penalized,
      reportsCount: reportedBy.length,
      threshold,
      reportedUserScore: newScore,
      reportedUserName: reportedPart.userName,
    };
  },
};

export const supabaseDbMessages = {
  getByRideId: async (rideId: string) => {
    const { data, error } = await getSupabaseAdmin()
      .from("messages")
      .select("*")
      .eq("ride_id", rideId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []).map(mapMessage);
  },
  create: async (rideId: string, userId: string, content: string) => {
    const user = await supabaseDbUsers.getById(userId);
    if (!user) throw new Error("User not found");
    const row = {
      id: generateId(),
      ride_id: rideId,
      user_id: userId,
      user_name: user.name,
      content,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await getSupabaseAdmin().from("messages").insert(row).select("*").single();
    if (error) throw error;
    return mapMessage(data);
  },
};

export async function supabaseSeedMockData() {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase.from("users").select("*", { count: "exact", head: true });
  if (count && count > 0) return;

  const users = [
    {
      id: "usr1",
      email: "2005123@kiit.ac.in",
      password_hash: bcrypt.hashSync("password123", 10),
      name: "Suyash Mishra",
      phone: "+91 9876543210",
      trust_score: 100,
      completed_rides_count: 8,
      no_shows_count: 0,
      joined_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "usr2",
      email: "2106041@kiit.ac.in",
      password_hash: bcrypt.hashSync("password123", 10),
      name: "Ananya Sen",
      phone: "+91 9998887776",
      trust_score: 95,
      completed_rides_count: 12,
      no_shows_count: 0,
      joined_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "usr3",
      email: "2204562@kiit.ac.in",
      password_hash: bcrypt.hashSync("password123", 10),
      name: "Rohit Sharma",
      phone: "+91 8887776665",
      trust_score: 70,
      completed_rides_count: 4,
      no_shows_count: 2,
      joined_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "usr4",
      email: "2005088@kiit.ac.in",
      password_hash: bcrypt.hashSync("password123", 10),
      name: "Priya Das",
      phone: "+91 7776665554",
      trust_score: 100,
      completed_rides_count: 20,
      no_shows_count: 0,
      joined_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    },
  ];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(17, 30, 0, 0);

  const rides = [
    {
      id: "ride1",
      creator_id: "usr2",
      creator_name: "Ananya Sen",
      creator_trust_score: 95,
      source: "KIIT Campus 3 (Hostels)",
      destination: "Biju Patnaik Airport (BBI)",
      departure_time: tomorrow.toISOString(),
      max_pool_size: 4,
      estimated_fare: 600,
      status: "active",
      description: "Flight is at 12 PM. Want to leave early to avoid traffic near Khandagiri.",
      created_at: new Date().toISOString(),
    },
    {
      id: "ride2",
      creator_id: "usr4",
      creator_name: "Priya Das",
      creator_trust_score: 100,
      source: "KIIT Campus 6",
      destination: "Bhubaneswar Railway Station",
      departure_time: dayAfter.toISOString(),
      max_pool_size: 3,
      estimated_fare: 300,
      status: "active",
      description: "Catching the Purushottam Express. Let's pool an auto or cab.",
      created_at: new Date().toISOString(),
    },
  ];

  const participants = [
    {
      id: "part1",
      ride_id: "ride1",
      user_id: "usr2",
      user_name: "Ananya Sen",
      user_email: "2106041@kiit.ac.in",
      user_phone: "+91 9998887776",
      user_trust_score: 95,
      status: "joined",
      joined_at: new Date().toISOString(),
      reported_by: [],
    },
    {
      id: "part2",
      ride_id: "ride1",
      user_id: "usr1",
      user_name: "Suyash Mishra",
      user_email: "2005123@kiit.ac.in",
      user_phone: "+91 9876543210",
      user_trust_score: 100,
      status: "joined",
      joined_at: new Date().toISOString(),
      reported_by: [],
    },
    {
      id: "part3",
      ride_id: "ride2",
      user_id: "usr4",
      user_name: "Priya Das",
      user_email: "2005088@kiit.ac.in",
      user_phone: "+91 7776665554",
      user_trust_score: 100,
      status: "joined",
      joined_at: new Date().toISOString(),
      reported_by: [],
    },
  ];

  const messages = [
    {
      id: "msg1",
      ride_id: "ride1",
      user_id: "usr2",
      user_name: "Ananya Sen",
      content: "Hey, I've booked an Uber XL. We have 2 spots left if anyone else wants to join!",
      created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    },
    {
      id: "msg2",
      ride_id: "ride1",
      user_id: "usr1",
      user_name: "Suyash Mishra",
      content: "Awesome, thanks for booking. I'll meet you near Campus 3 main gate at 8:45 AM.",
      created_at: new Date(Date.now() - 1800 * 1000).toISOString(),
    },
  ];

  await supabase.from("users").insert(users);
  await supabase.from("rides").insert(rides);
  await supabase.from("participants").insert(participants);
  await supabase.from("messages").insert(messages);
}
