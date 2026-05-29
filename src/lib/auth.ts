// Simple session-based auth using Google OAuth
// We store a user record in Turso and use cookies for session

import db from "./db";

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  isOwner: boolean;
  createdAt: string;
}

const OWNER_EMAIL = "tandonluv25@gmail.com";

export function isOwnerEmail(email: string): boolean {
  return email.toLowerCase() === OWNER_EMAIL.toLowerCase();
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
