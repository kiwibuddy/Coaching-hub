import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../db";
import { eq } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  upsertUser(userData: UpsertUser): Promise<User>;
  findOrCreateUserByGoogle(profile: {
    id: string;
    email?: string | null;
    given_name?: string | null;
    family_name?: string | null;
    picture?: string | null;
  }): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async findOrCreateUserByGoogle(profile: {
    id: string;
    email?: string | null;
    given_name?: string | null;
    family_name?: string | null;
    picture?: string | null;
  }): Promise<User> {
    const existingByGoogle = await this.getUserByGoogleId(profile.id);
    if (existingByGoogle) return existingByGoogle;

    if (profile.email) {
      const existingByEmail = await this.getUserByEmail(profile.email);
      if (existingByEmail) {
        await db
          .update(users)
          .set({
            googleId: profile.id,
            firstName: profile.given_name ?? existingByEmail.firstName,
            lastName: profile.family_name ?? existingByEmail.lastName,
            profileImageUrl: profile.picture ?? existingByEmail.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingByEmail.id));
        const [updated] = await db.select().from(users).where(eq(users.id, existingByEmail.id));
        return updated!;
      }
    }

    const [user] = await db
      .insert(users)
      .values({
        googleId: profile.id,
        email: profile.email ?? null,
        firstName: profile.given_name ?? null,
        lastName: profile.family_name ?? null,
        profileImageUrl: profile.picture ?? null,
        role: "client",
      })
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
}

export const authStorage = new AuthStorage();
