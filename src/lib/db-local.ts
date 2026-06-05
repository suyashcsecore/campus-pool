import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import type { Message, Ride, RideParticipant, User } from "./types";
import { generateId } from "./mappers";

export type { User, Ride, RideParticipant, Message } from "./types";

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

interface DatabaseSchema {
  users: User[];
  rides: Ride[];
  participants: RideParticipant[];
  messages: Message[];
}

const defaultSchema: DatabaseSchema = {
  users: [],
  rides: [],
  participants: [],
  messages: [],
};

function initializeDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultSchema, null, 2), "utf-8");
  }
}

function readDb(): DatabaseSchema {
  initializeDb();
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data) as DatabaseSchema;
  } catch {
    return defaultSchema;
  }
}

function writeDb(data: DatabaseSchema): void {
  initializeDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const localDbUsers = {
  getAll: async () => readDb().users,
  getById: async (id: string) => readDb().users.find((u) => u.id === id),
  getByEmail: async (email: string) =>
    readDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  create: async (
    user: Omit<User, "id" | "trustScore" | "completedRidesCount" | "noShowsCount" | "joinedAt">
  ) => {
    const db = readDb();
    if (db.users.find((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
      throw new Error("User with this email already exists");
    }
    const passwordHash = await bcrypt.hash(user.passwordHash, 10);
    const newUser: User = {
      id: generateId(),
      email: user.email.toLowerCase(),
      passwordHash,
      name: user.name,
      phone: user.phone,
      trustScore: 100,
      completedRidesCount: 0,
      noShowsCount: 0,
      joinedAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    writeDb(db);
    return newUser;
  },
  updateTrustScore: async (userId: string, penalty: number) => {
    const db = readDb();
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.trustScore = Math.max(0, Math.min(100, user.trustScore - penalty));
      if (penalty > 0) user.noShowsCount += 1;
      db.participants.forEach((p) => {
        if (p.userId === userId) p.userTrustScore = user.trustScore;
      });
      db.rides.forEach((r) => {
        if (r.creatorId === userId) r.creatorTrustScore = user.trustScore;
      });
      writeDb(db);
    }
    return user;
  },
};

export const localDbRides = {
  getAll: async () => readDb().rides,
  getById: async (id: string) => readDb().rides.find((r) => r.id === id),
  create: async (
    ride: Omit<Ride, "id" | "creatorId" | "status" | "createdAt" | "creatorName" | "creatorTrustScore">,
    creatorId: string
  ) => {
    const db = readDb();
    const creator = db.users.find((u) => u.id === creatorId);
    if (!creator) throw new Error("Creator user not found");
    const newRide: Ride = {
      ...ride,
      id: generateId(),
      creatorId,
      creatorName: creator.name,
      creatorTrustScore: creator.trustScore,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    const newParticipant: RideParticipant = {
      id: generateId(),
      rideId: newRide.id,
      userId: creator.id,
      userName: creator.name,
      userEmail: creator.email,
      userPhone: creator.phone,
      userTrustScore: creator.trustScore,
      status: "joined",
      joinedAt: new Date().toISOString(),
    };
    db.rides.push(newRide);
    db.participants.push(newParticipant);
    writeDb(db);
    return { ride: newRide, participant: newParticipant };
  },
  updateStatus: async (rideId: string, status: "completed" | "cancelled") => {
    const db = readDb();
    const ride = db.rides.find((r) => r.id === rideId);
    if (ride) {
      ride.status = status;
      if (status === "completed") {
        db.participants
          .filter(
            (p) =>
              p.rideId === rideId &&
              (p.status === "completed" || p.status === "arrived" || p.status === "joined")
          )
          .forEach((p) => {
            p.status = "completed";
            const user = db.users.find((u) => u.id === p.userId);
            if (user) user.completedRidesCount += 1;
          });
      }
      writeDb(db);
    }
    return ride;
  },
};

export const localDbParticipants = {
  getByRideId: async (rideId: string) =>
    readDb().participants.filter((p) => p.rideId === rideId),
  joinRide: async (rideId: string, userId: string) => {
    const db = readDb();
    const ride = db.rides.find((r) => r.id === rideId);
    if (!ride) throw new Error("Ride not found");
    if (ride.status !== "active") throw new Error("Ride is no longer active");
    if (db.participants.find((p) => p.rideId === rideId && p.userId === userId)) {
      throw new Error("User has already joined this ride");
    }
    if (db.participants.filter((p) => p.rideId === rideId).length >= ride.maxPoolSize) {
      throw new Error("Ride pool is full");
    }
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    const newParticipant: RideParticipant = {
      id: generateId(),
      rideId,
      userId,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      userTrustScore: user.trustScore,
      status: "joined",
      joinedAt: new Date().toISOString(),
    };
    db.participants.push(newParticipant);
    writeDb(db);
    return newParticipant;
  },
  leaveRide: async (rideId: string, userId: string) => {
    const db = readDb();
    const ride = db.rides.find((r) => r.id === rideId);
    if (!ride) throw new Error("Ride not found");
    if (ride.creatorId === userId) throw new Error("Creator cannot leave the ride. Cancel the ride instead.");
    const index = db.participants.findIndex((p) => p.rideId === rideId && p.userId === userId);
    if (index === -1) throw new Error("Participant not found");
    db.participants.splice(index, 1);
    writeDb(db);
    return true;
  },
  updateStatus: async (rideId: string, userId: string, status: RideParticipant["status"]) => {
    const db = readDb();
    const participant = db.participants.find((p) => p.rideId === rideId && p.userId === userId);
    if (!participant) throw new Error("Participant not found");
    participant.status = status;
    writeDb(db);
    return participant;
  },
  reportNoShow: async (rideId: string, reporterId: string, reportedUserId: string) => {
    const db = readDb();
    const ride = db.rides.find((r) => r.id === rideId);
    if (!ride) throw new Error("Ride not found");
    const participants = db.participants.filter((p) => p.rideId === rideId);
    const reporterPart = participants.find((p) => p.userId === reporterId);
    const reportedPart = participants.find((p) => p.userId === reportedUserId);
    if (!reporterPart) throw new Error("You are not a participant in this ride");
    if (!reportedPart) throw new Error("Reported user is not a participant in this ride");
    if (reportedPart.status === "noshow") throw new Error("User is already flagged as a no-show");
    if (!reportedPart.reportedBy) reportedPart.reportedBy = [];
    if (reportedPart.reportedBy.includes(reporterId)) {
      throw new Error("You have already reported this user");
    }
    reportedPart.reportedBy.push(reporterId);
    const otherCount = participants.length - 1;
    const threshold = Math.max(1, Math.floor(otherCount / 2) + 1);
    let penalized = false;
    let newScore = reportedPart.userTrustScore;
    if (reportedPart.reportedBy.length >= threshold) {
      reportedPart.status = "noshow";
      const reportedUserObj = db.users.find((u) => u.id === reportedUserId);
      if (reportedUserObj) {
        reportedUserObj.trustScore = Math.max(0, reportedUserObj.trustScore - 15);
        reportedUserObj.noShowsCount += 1;
        newScore = reportedUserObj.trustScore;
        db.participants.forEach((p) => {
          if (p.userId === reportedUserId) p.userTrustScore = newScore;
        });
        db.rides.forEach((r) => {
          if (r.creatorId === reportedUserId) r.creatorTrustScore = newScore;
        });
      }
      penalized = true;
    }
    writeDb(db);
    return {
      penalized,
      reportsCount: reportedPart.reportedBy.length,
      threshold,
      reportedUserScore: newScore,
      reportedUserName: reportedPart.userName,
    };
  },
};

export const localDbMessages = {
  getByRideId: async (rideId: string) => readDb().messages.filter((m) => m.rideId === rideId),
  create: async (rideId: string, userId: string, content: string) => {
    const db = readDb();
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    const newMessage: Message = {
      id: generateId(),
      rideId,
      userId,
      userName: user.name,
      content,
      createdAt: new Date().toISOString(),
    };
    db.messages.push(newMessage);
    writeDb(db);
    return newMessage;
  },
};

export async function localSeedMockData() {
  const db = readDb();
  if (db.users.length > 0) return;
  const users: User[] = [
    {
      id: "usr1",
      email: "2005123@kiit.ac.in",
      passwordHash: bcrypt.hashSync("password123", 10),
      name: "Suyash Mishra",
      phone: "+91 9876543210",
      trustScore: 100,
      completedRidesCount: 8,
      noShowsCount: 0,
      joinedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "usr2",
      email: "2106041@kiit.ac.in",
      passwordHash: bcrypt.hashSync("password123", 10),
      name: "Ananya Sen",
      phone: "+91 9998887776",
      trustScore: 95,
      completedRidesCount: 12,
      noShowsCount: 0,
      joinedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "usr3",
      email: "2204562@kiit.ac.in",
      passwordHash: bcrypt.hashSync("password123", 10),
      name: "Rohit Sharma",
      phone: "+91 8887776665",
      trustScore: 70,
      completedRidesCount: 4,
      noShowsCount: 2,
      joinedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "usr4",
      email: "2005088@kiit.ac.in",
      passwordHash: bcrypt.hashSync("password123", 10),
      name: "Priya Das",
      phone: "+91 7776665554",
      trustScore: 100,
      completedRidesCount: 20,
      noShowsCount: 0,
      joinedAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    },
  ];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(17, 30, 0, 0);
  db.users = users;
  db.rides = [
    {
      id: "ride1",
      creatorId: "usr2",
      creatorName: "Ananya Sen",
      creatorTrustScore: 95,
      source: "KIIT Campus 3 (Hostels)",
      destination: "Biju Patnaik Airport (BBI)",
      departureTime: tomorrow.toISOString(),
      maxPoolSize: 4,
      estimatedFare: 600,
      status: "active",
      description: "Flight is at 12 PM. Want to leave early to avoid traffic near Khandagiri.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "ride2",
      creatorId: "usr4",
      creatorName: "Priya Das",
      creatorTrustScore: 100,
      source: "KIIT Campus 6",
      destination: "Bhubaneswar Railway Station",
      departureTime: dayAfter.toISOString(),
      maxPoolSize: 3,
      estimatedFare: 300,
      status: "active",
      description: "Catching the Purushottam Express. Let's pool an auto or cab.",
      createdAt: new Date().toISOString(),
    },
  ];
  db.participants = [
    {
      id: "part1",
      rideId: "ride1",
      userId: "usr2",
      userName: "Ananya Sen",
      userEmail: "2106041@kiit.ac.in",
      userPhone: "+91 9998887776",
      userTrustScore: 95,
      status: "joined",
      joinedAt: new Date().toISOString(),
    },
    {
      id: "part2",
      rideId: "ride1",
      userId: "usr1",
      userName: "Suyash Mishra",
      userEmail: "2005123@kiit.ac.in",
      userPhone: "+91 9876543210",
      userTrustScore: 100,
      status: "joined",
      joinedAt: new Date().toISOString(),
    },
    {
      id: "part3",
      rideId: "ride2",
      userId: "usr4",
      userName: "Priya Das",
      userEmail: "2005088@kiit.ac.in",
      userPhone: "+91 7776665554",
      userTrustScore: 100,
      status: "joined",
      joinedAt: new Date().toISOString(),
    },
  ];
  db.messages = [
    {
      id: "msg1",
      rideId: "ride1",
      userId: "usr2",
      userName: "Ananya Sen",
      content: "Hey, I've booked an Uber XL. We have 2 spots left if anyone else wants to join!",
      createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    },
    {
      id: "msg2",
      rideId: "ride1",
      userId: "usr1",
      userName: "Suyash Mishra",
      content: "Awesome, thanks for booking. I'll meet you near Campus 3 main gate at 8:45 AM.",
      createdAt: new Date(Date.now() - 1800 * 1000).toISOString(),
    },
  ];
  writeDb(db);
}
