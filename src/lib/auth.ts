import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { dbUsers, User } from "./db";

function getJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  return "campuspool-dev-only-secret";
}
const TOKEN_COOKIE_NAME = "campuspool_session";

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
}

// Generate JWT token
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

// Verify JWT token
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch {
    return null;
  }
}

// Authenticate user in route handlers using cookies
export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await dbUsers.getById(payload.userId);
  return user || null;
}

// Set cookie for session
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: "/",
  });
}

// Clear cookie for session
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
}

// Utility to validate college email
export function isValidCollegeEmail(email: string): boolean {
  const lowercaseEmail = email.toLowerCase();
  
  // Custom check for kiit.ac.in as requested by user
  if (lowercaseEmail.endsWith("@kiit.ac.in")) {
    return true;
  }
  
  // Generic validation for other ac.in or edu domains
  const parts = lowercaseEmail.split("@");
  if (parts.length !== 2) return false;
  
  const domain = parts[1];
  return domain.endsWith(".edu") || domain.endsWith(".ac.in");
}
