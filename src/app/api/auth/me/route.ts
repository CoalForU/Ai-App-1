import { NextResponse } from "next/server";
import { getSessionUser, publicUser } from "@/lib/auth";
import { findUserById } from "@/lib/db";
import { getScanUsage } from "@/lib/scans";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ user: null, usage: null });
  const user = await findUserById(session.id);
  if (!user) return NextResponse.json({ user: null, usage: null });
  const usage = await getScanUsage();
  return NextResponse.json({ user: publicUser(user), usage });
}
