import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

// Session storage table (express-session with connect-pg-simple).
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table (email/password and Google OAuth).
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: varchar("username").unique(), // For email/password login
  password: varchar("password"), // Hashed password for email/password accounts
  googleId: varchar("google_id").unique(), // Google OAuth sub
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("client"), // 'client' or 'coach'
  timezone: varchar("timezone").default("UTC"), // IANA timezone e.g. "America/New_York"
  emailVerified: boolean("email_verified").default(false), // Email verification status
  verificationToken: varchar("verification_token"), // Token for email verification
  verificationTokenExpiry: timestamp("verification_token_expiry"), // Token expiry time
  passwordResetToken: varchar("password_reset_token"), // Token for password reset
  passwordResetExpiry: timestamp("password_reset_expiry"), // Token expiry time
  onboardingCompleted: boolean("onboarding_completed").default(false), // Onboarding wizard completed
  colorTheme: varchar("color_theme"), // Color theme preference: ember, ocean, forest, twilight, slate, rose
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
