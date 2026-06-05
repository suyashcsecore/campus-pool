export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  trustScore: number;
  completedRidesCount: number;
  noShowsCount: number;
  joinedAt: string;
}

export interface Ride {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorTrustScore: number;
  source: string;
  destination: string;
  departureTime: string;
  maxPoolSize: number;
  estimatedFare: number;
  status: "active" | "completed" | "cancelled";
  description: string;
  createdAt: string;
}

export interface RideParticipant {
  id: string;
  rideId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userTrustScore: number;
  status: "joined" | "arrived" | "noshow" | "completed";
  joinedAt: string;
  reportedBy?: string[];
}

export interface Message {
  id: string;
  rideId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}
