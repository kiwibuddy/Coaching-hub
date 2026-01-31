import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../db";
import { eq, or } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  upsertUser(userData: UpsertUser): Promise<User>;
  setVerificationToken(userId: string, token: string, expiry: Date): Promise<void>;
  setPasswordResetToken(userId: string, token: string, expiry: Date): Promise<void>;
  resetPassword(userId: string, hashedPassword: string): Promise<void>;
  verifyEmail(userId: string): Promise<void>;
  markOnboardingCompleted(userId: string): Promise<void>;
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
    if (!email || typeof email !== "string") return undefined;
    const trimmed = email.trim();
    const normalized = trimmed.toLowerCase();
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, normalized), eq(users.email, trimmed)));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user;
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
    return user;
  }

  async setPasswordResetToken(userId: string, token: string, expiry: Date): Promise<void> {
    await db.update(users).set({
      passwordResetToken: token,
      passwordResetExpiry: expiry,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  }

  async resetPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  }

  async setVerificationToken(userId: string, token: string, expiry: Date): Promise<void> {
    await db.update(users).set({
      verificationToken: token,
      verificationTokenExpiry: expiry,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  }

  async verifyEmail(userId: string): Promise<void> {
    await db.update(users).set({
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  }

  async markOnboardingCompleted(userId: string): Promise<void> {
    await db.update(users).set({
      onboardingCompleted: true,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
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
        // Linking Google to existing account also verifies the email
        await db
          .update(users)
          .set({
            googleId: profile.id,
            emailVerified: true,
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

    // Google users are automatically verified
    const [user] = await db
      .insert(users)
      .values({
        googleId: profile.id,
        email: profile.email ?? null,
        firstName: profile.given_name ?? null,
        lastName: profile.family_name ?? null,
        profileImageUrl: profile.picture ?? null,
        emailVerified: true,
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
