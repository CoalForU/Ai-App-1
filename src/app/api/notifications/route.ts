import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  fanOutEndingSoon,
  getUserNotifications,
  markNotificationsRead,
} from "@/lib/marketplace";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  await fanOutEndingSoon();
  const notifications = await getUserNotifications(user.id);
  const unread = notifications.filter((n) => !n.read).length;
  return NextResponse.json({ notifications, unread });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { ids?: string[] };
  const notifications = await markNotificationsRead(user.id, body.ids);
  return NextResponse.json({ notifications });
}
