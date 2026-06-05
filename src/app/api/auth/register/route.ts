import { NextRequest, NextResponse } from "next/server";
import { dbUsers, seedMockData } from "@/lib/db";
import { isValidCollegeEmail, setSessionCookie, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await seedMockData();

  try {
    const body = await req.json();
    const { email, password, name, phone } = body;

    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { error: "All fields (email, password, name, phone) are required" },
        { status: 400 }
      );
    }

    if (!isValidCollegeEmail(email)) {
      return NextResponse.json(
        { error: "Registration is restricted to college email IDs only (e.g., @kiit.ac.in, *.edu, *.ac.in)" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const existingUser = await dbUsers.getByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this college email already exists" },
        { status: 400 }
      );
    }

    const newUser = await dbUsers.create({
      email,
      passwordHash: password,
      name,
      phone,
    });

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    await setSessionCookie(token);

    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      { message: "Registration successful", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
