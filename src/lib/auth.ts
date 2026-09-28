import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { findUserByEmail, findUserById, upsertUser } from "./db";
import type { PlanId, UserRecord } from "./types";
import { PLAN_LIMITS } from "./types";

const COOKIE_NAME = "resellr_session";

function authSecret() {
  const secret = process.env.AUTH_SECRET || "resellr-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  plan: PlanId;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}) {
  const existing = await findUserByEmail(input.email);
  if (existing) throw new Error("An account with that email already exists.");

  const user: UserRecord = {
    id: randomUUID(),
    email: input.email.trim().toLowerCase(),
    name: input.name.trim() || "Reseller",
    passwordHash: await hashPassword(input.password),
    plan: "basic",
    createdAt: new Date().toISOString(),
  };
  await upsertUser(user);
  return user;
}

export async function authenticate(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  return ok ? user : null;
}

export async function setSession(user: UserRecord) {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(authSecret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, authSecret());
    const id = String(payload.sub || "");
    if (!id) return null;
    const user = await findUserById(id);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
    };
  } catch {
    return null;
  }
}

export function publicUser(user: UserRecord | SessionUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    limits: PLAN_LIMITS[user.plan],
  };
}
