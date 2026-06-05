import { isSupabaseConfigured } from "./supabase/server";
import * as local from "./db-local";
import * as remote from "./db-supabase";
import type { RideParticipant } from "./types";

export type { User, Ride, RideParticipant, Message } from "./types";

function useRemote() {
  return isSupabaseConfigured();
}

export const dbUsers = {
  getAll: () => (useRemote() ? remote.supabaseDbUsers.getAll() : local.localDbUsers.getAll()),
  getById: (id: string) => (useRemote() ? remote.supabaseDbUsers.getById(id) : local.localDbUsers.getById(id)),
  getByEmail: (email: string) =>
    useRemote() ? remote.supabaseDbUsers.getByEmail(email) : local.localDbUsers.getByEmail(email),
  create: (
    user: Parameters<typeof local.localDbUsers.create>[0]
  ) => (useRemote() ? remote.supabaseDbUsers.create(user) : local.localDbUsers.create(user)),
  updateTrustScore: (userId: string, penalty: number) =>
    useRemote()
      ? remote.supabaseDbUsers.updateTrustScore(userId, penalty)
      : local.localDbUsers.updateTrustScore(userId, penalty),
};

export const dbRides = {
  getAll: () => (useRemote() ? remote.supabaseDbRides.getAll() : local.localDbRides.getAll()),
  getById: (id: string) => (useRemote() ? remote.supabaseDbRides.getById(id) : local.localDbRides.getById(id)),
  create: (
    ride: Parameters<typeof local.localDbRides.create>[0],
    creatorId: string
  ) => (useRemote() ? remote.supabaseDbRides.create(ride, creatorId) : local.localDbRides.create(ride, creatorId)),
  updateStatus: (rideId: string, status: "completed" | "cancelled") =>
    useRemote()
      ? remote.supabaseDbRides.updateStatus(rideId, status)
      : local.localDbRides.updateStatus(rideId, status),
};

export const dbParticipants = {
  getByRideId: (rideId: string) =>
    useRemote() ? remote.supabaseDbParticipants.getByRideId(rideId) : local.localDbParticipants.getByRideId(rideId),
  joinRide: (rideId: string, userId: string) =>
    useRemote()
      ? remote.supabaseDbParticipants.joinRide(rideId, userId)
      : local.localDbParticipants.joinRide(rideId, userId),
  leaveRide: (rideId: string, userId: string) =>
    useRemote()
      ? remote.supabaseDbParticipants.leaveRide(rideId, userId)
      : local.localDbParticipants.leaveRide(rideId, userId),
  updateStatus: (rideId: string, userId: string, status: RideParticipant["status"]) =>
    useRemote()
      ? remote.supabaseDbParticipants.updateStatus(rideId, userId, status)
      : local.localDbParticipants.updateStatus(rideId, userId, status),
  reportNoShow: (rideId: string, reporterId: string, reportedUserId: string) =>
    useRemote()
      ? remote.supabaseDbParticipants.reportNoShow(rideId, reporterId, reportedUserId)
      : local.localDbParticipants.reportNoShow(rideId, reporterId, reportedUserId),
};

export const dbMessages = {
  getByRideId: (rideId: string) =>
    useRemote() ? remote.supabaseDbMessages.getByRideId(rideId) : local.localDbMessages.getByRideId(rideId),
  create: (rideId: string, userId: string, content: string) =>
    useRemote()
      ? remote.supabaseDbMessages.create(rideId, userId, content)
      : local.localDbMessages.create(rideId, userId, content),
};

export async function seedMockData() {
  if (useRemote()) {
    await remote.supabaseSeedMockData();
  } else {
    await local.localSeedMockData();
  }
}

export function getDatabaseMode(): "supabase" | "local" {
  return useRemote() ? "supabase" : "local";
}
