import { NextResponse } from "next/server";
import { createUser, publicUser, setSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!body.email || !body.password || body.password.length < 6) {
      return NextResponse.json(
        { error: "Email and a password (6+ chars) are required." },
        { status: 400 },
      );
    }

    const user = await createUser({
      email: body.email,
      password: body.password,
      name: body.name || "Reseller",
    });
    await setSession(user);
    return NextResponse.json({ user: publicUser(user) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Signup failed" },
      { status: 400 },
    );
  }
}
