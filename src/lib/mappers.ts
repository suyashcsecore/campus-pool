import type { Message, Ride, RideParticipant, User } from "./types";

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function mapUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    passwordHash: row.password_hash as string,
    name: row.name as string,
    phone: row.phone as string,
    trustScore: row.trust_score as number,
    completedRidesCount: row.completed_rides_count as number,
    noShowsCount: row.no_shows_count as number,
    joinedAt: row.joined_at as string,
  };
}

export function mapRide(row: Record<string, unknown>): Ride {
  return {
    id: row.id as string,
    creatorId: row.creator_id as string,
    creatorName: row.creator_name as string,
    creatorTrustScore: row.creator_trust_score as number,
    source: row.source as string,
    destination: row.destination as string,
    departureTime: row.departure_time as string,
    maxPoolSize: row.max_pool_size as number,
    estimatedFare: row.estimated_fare as number,
    status: row.status as Ride["status"],
    description: (row.description as string) || "",
    createdAt: row.created_at as string,
  };
}

export function mapParticipant(row: Record<string, unknown>): RideParticipant {
  return {
    id: row.id as string,
    rideId: row.ride_id as string,
    userId: row.user_id as string,
    userName: row.user_name as string,
    userEmail: row.user_email as string,
    userPhone: row.user_phone as string,
    userTrustScore: row.user_trust_score as number,
    status: row.status as RideParticipant["status"],
    joinedAt: row.joined_at as string,
    reportedBy: (row.reported_by as string[]) || [],
  };
}

export function mapMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    rideId: row.ride_id as string,
    userId: row.user_id as string,
    userName: row.user_name as string,
    content: row.content as string,
    createdAt: row.created_at as string,
  };
}

export function mapMessageFromRealtime(payload: Record<string, unknown>): Message {
  return mapMessage(payload);
}
