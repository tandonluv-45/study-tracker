// Session-based auth: Google OAuth + email/password.
// We store a user record in Turso and use cookies for session.

import db from "./db";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  isOwner: boolean;
  createdAt: string;
}

// Thrown for a wrong password so the API route can answer 401.
export class AuthError extends Error {}

const OWNER_EMAIL = "tandonluv25@gmail.com";

export function isOwnerEmail(email: string): boolean {
  return email.toLowerCase() === OWNER_EMAIL.toLowerCase();
}

// ---- password hashing (scrypt, no external deps) ----
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const test = scryptSync(password, salt, 64);
  const known = Buffer.from(hash, "hex");
  return test.length === known.length && timingSafeEqual(test, known);
}

// Email/password sign-in. Creates the account if new; if the email already
// exists without a password (e.g. created via Google) the given password is
// attached to it, so an existing account keeps all its data.
export async function loginWithPassword(rawEmail: string, password: string): Promise<User> {
  const email = rawEmail.trim().toLowerCase();
  const res = await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email] });

  if (res.rows.length > 0) {
    const row = res.rows[0];
    const stored = row.password_hash ? String(row.password_hash) : null;
    if (stored) {
      if (!verifyPassword(password, stored)) throw new AuthError("Incorrect password");
    } else {
      await db.execute({
        sql: "UPDATE users SET password_hash = ? WHERE id = ?",
        args: [hashPassword(password), String(row.id)],
      });
    }
    return {
      id: String(row.id), email: String(row.email), name: String(row.name),
      picture: row.picture ? String(row.picture) : undefined,
      isOwner: Boolean(row.is_owner), createdAt: String(row.created_at),
    };
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const owner = isOwnerEmail(email) ? 1 : 0;
  const name = email.split("@")[0];
  await db.execute({
    sql: "INSERT INTO users (id, email, name, is_owner, created_at, password_hash) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, email, name, owner, now, hashPassword(password)],
  });
  return { id, email, name, isOwner: Boolean(owner), createdAt: now };
}

export async function findOrCreateUser(email: string, name: string, picture?: string): Promise<User> {
  const existing = await db.execute({
    sql: "SELECT * FROM users WHERE email = ?",
    args: [email],
  });

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    return {
      id: String(row.id),
      email: String(row.email),
      name: String(row.name),
      picture: row.picture ? String(row.picture) : undefined,
      isOwner: Boolean(row.is_owner),
      createdAt: String(row.created_at),
    };
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const owner = isOwnerEmail(email) ? 1 : 0;

  await db.execute({
    sql: "INSERT INTO users (id, email, name, picture, is_owner, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, email, name, picture || null, owner, now],
  });

  return { id, email, name, picture, isOwner: Boolean(owner), createdAt: now };
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await db.execute({
    sql: "SELECT * FROM users WHERE id = ?",
    args: [id],
  });

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    picture: row.picture ? String(row.picture) : undefined,
    isOwner: Boolean(row.is_owner),
    createdAt: String(row.created_at),
  };
}
