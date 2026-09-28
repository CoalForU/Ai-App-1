import { promises as fs } from "fs";
import path from "path";
import type { ScanMonth, UserRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SCANS_FILE = path.join(DATA_DIR, "scans.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, value: T) {
  await ensureDataDir();
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

export async function listUsers() {
  return readJson<UserRecord[]>(USERS_FILE, []);
}

export async function saveUsers(users: UserRecord[]) {
  await writeJson(USERS_FILE, users);
}

export async function findUserByEmail(email: string) {
  const users = await listUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string) {
  const users = await listUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function upsertUser(user: UserRecord) {
  const users = await listUsers();
  const index = users.findIndex((u) => u.id === user.id);
  if (index >= 0) users[index] = user;
  else users.push(user);
  await saveUsers(users);
  return user;
}

export async function listScanMonths() {
  return readJson<ScanMonth[]>(SCANS_FILE, []);
}

export async function getScanCount(userId: string, monthKey: string) {
  const rows = await listScanMonths();
  return rows.find((r) => r.userId === userId && r.monthKey === monthKey)?.count ?? 0;
}

export async function incrementScanCount(userId: string, monthKey: string) {
  const rows = await listScanMonths();
  const index = rows.findIndex((r) => r.userId === userId && r.monthKey === monthKey);
  if (index >= 0) {
    rows[index] = { ...rows[index], count: rows[index].count + 1 };
  } else {
    rows.push({ userId, monthKey, count: 1 });
  }
  await writeJson(SCANS_FILE, rows);
  const row = rows.find((r) => r.userId === userId && r.monthKey === monthKey)!;
  return row.count;
}

export function currentMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
