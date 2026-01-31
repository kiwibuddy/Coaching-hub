import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Enums
export const userRoleEnum = pgEnum("user_role", ["coach", "client"]);
export const intakeStatusEnum = pgEnum("intake_status", ["pending", "accepted", "declined"]);
export const sessionStatusEnum = pgEnum("session_status", ["pending_confirmation", "scheduled", "completed", "cancelled"]);
export const actionStatusEnum = pgEnum("action_status", ["pending", "in_progress", "completed"]);
export const notificationTypeEnum = pgEnum("notification_type", ["intake_submitted", "account_created", "session_scheduled", "session_reminder", "resource_uploaded", "action_assigned", "session_request", "payment_received", "action_due", "session_cancelled"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
export const paymentProviderEnum = pgEnum("payment_provider", ["stripe", "paypal"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "paid", "overdue", "cancelled"]);

// Client Profiles - extends user data for clients
export const clientProfiles = pgTable("client_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  phone: varchar("phone"),
  goals: text("goals"),
  location: varchar("location"), // City, Country
  preferredMeetingFormat: varchar("preferred_meeting_format"), // in_person, video_zoom, video_meet, flexible
  preferredContactMethod: varchar("preferred_contact_method").default("email"),
  notificationPreferences: text("notification_preferences").default("{}"),
  // Coaching background
  previousCoaching: text("previous_coaching"), // Previous coaching experience
  assessmentsTaken: text("assessments_taken"), // JSON array: ["strengthsfinder", "disc", etc.]
  assessmentResults: text("assessment_results"), // Free text for results
  // Onboarding status
  profileCompleted: boolean("profile_completed").default(false),
  status: varchar("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Intake Forms
export const intakeForms = pgTable("intake_forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  goals: text("goals").notNull(),
  experience: text("experience"),
  availability: text("availability"),
  howDidYouHear: varchar("how_did_you_hear"),
  // New onboarding fields
  location: varchar("location"), // City, Country
  preferredMeetingFormat: varchar("preferred_meeting_format"), // in_person, video_zoom, video_meet, flexible
  previousCoachingExperience: text("previous_coaching_experience"), // Description of prior coaching
  assessmentsTaken: text("assessments_taken"), // JSON array: ["strengthsfinder", "disc", etc.]
  assessmentResults: text("assessment_results"), // Free text for results (e.g., "Top 5: Achiever, Learner, Input...")
  status: intakeStatusEnum("status").default("pending"),
  coachNotes: text("coach_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Coaching Sessions
export const coachingSessions = pgTable("coaching_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").default(60),
  status: sessionStatusEnum("status").default("pending_confirmation"),
  requestedBy: varchar("requested_by").notNull(), // 'client' or 'coach'
  meetingLink: varchar("meeting_link"),
  prepNotes: text("prep_notes"),
  sessionNotes: text("session_notes"),
  notesVisibleToClient: boolean("notes_visible_to_client").default(false),
  clientReflection: text("client_reflection"),
  // Calendar sync fields
  googleCalendarEventId: varchar("google_calendar_event_id"),
  calendarSyncedAt: timestamp("calendar_synced_at"),
  reminderSentAt: timestamp("reminder_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Resources
export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  fileUrl: varchar("file_url"),
  fileType: varchar("file_type"),
  fileName: varchar("file_name"),
  sessionId: varchar("session_id"),
  clientId: varchar("client_id"),
  isGlobal: boolean("is_global").default(false),
  uploadedBy: varchar("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Action Items
export const actionItems = pgTable("action_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  sessionId: varchar("session_id"),
  title: varchar("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  status: actionStatusEnum("status").default("pending"),
  completedAt: timestamp("completed_at"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedId: varchar("related_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages (within sessions)
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Testimonials (for public site)
export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientName: varchar("client_name").notNull(),
  content: text("content").notNull(),
  rating: integer("rating").default(5),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Coach settings
export const coachSettings = pgTable("coach_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  // Profile/business info
  businessName: varchar("business_name"),
  bio: text("bio"),
  location: varchar("location"), // City, Country
  countryCode: varchar("country_code"), // Phone country code e.g. "+1", "+44"
  phone: varchar("phone"), // Phone number without country code
  // Pricing
  hourlyRate: integer("hourly_rate").default(150),
  sessionDuration: integer("session_duration").default(60),
  packageDiscount: integer("package_discount").default(10),
  // Payment settings
  stripeAccountId: varchar("stripe_account_id"), // For Stripe Connect (optional)
  paypalEmail: varchar("paypal_email"), // For PayPal payouts
  // Onboarding
  onboardingCompleted: boolean("onboarding_completed").default(false),
  // Appearance
  colorTheme: varchar("color_theme").default("ember"), // Default theme for coach's portal
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  invoiceId: varchar("invoice_id"),
  sessionId: varchar("session_id"),
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency").default("usd").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  provider: paymentProviderEnum("provider").notNull(),
  providerPaymentId: varchar("provider_payment_id"), // Stripe payment_intent or PayPal order ID
  providerCustomerId: varchar("provider_customer_id"), // Stripe customer ID
  description: text("description"),
  metadata: text("metadata"), // JSON string for additional data
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  clientId: varchar("client_id").notNull(),
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency").default("usd").notNull(),
  status: invoiceStatusEnum("status").default("draft").notNull(),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  items: text("items").notNull(), // JSON array of line items
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OAuth tokens for calendar sync
export const userOAuthTokens = pgTable("user_oauth_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  provider: varchar("provider").notNull(), // 'google_calendar', etc.
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  scope: text("scope"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const clientProfilesRelations = relations(clientProfiles, ({ many }) => ({
  sessions: many(coachingSessions),
  resources: many(resources),
  actionItems: many(actionItems),
}));

export const coachingSessionsRelations = relations(coachingSessions, ({ many }) => ({
  resources: many(resources),
  actionItems: many(actionItems),
  messages: many(messages),
}));

// Insert schemas
export const insertClientProfileSchema = createInsertSchema(clientProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIntakeFormSchema = createInsertSchema(intakeForms).omit({
  id: true,
  status: true,
  coachNotes: true,
  createdAt: true,
  reviewedAt: true,
});

export const insertSessionSchema = createInsertSchema(coachingSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
});

export const insertActionItemSchema = createInsertSchema(actionItems).omit({
  id: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  isPublished: true,
  createdAt: true,
});

export const insertCoachSettingsSchema = createInsertSchema(coachSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserOAuthTokenSchema = createInsertSchema(userOAuthTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type ClientProfile = typeof clientProfiles.$inferSelect;
export type InsertClientProfile = z.infer<typeof insertClientProfileSchema>;

export type IntakeForm = typeof intakeForms.$inferSelect;
export type InsertIntakeForm = z.infer<typeof insertIntakeFormSchema>;

export type Session = typeof coachingSessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type ActionItem = typeof actionItems.$inferSelect;
export type InsertActionItem = z.infer<typeof insertActionItemSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export type CoachSettings = typeof coachSettings.$inferSelect;
export type InsertCoachSettings = z.infer<typeof insertCoachSettingsSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type UserOAuthToken = typeof userOAuthTokens.$inferSelect;
export type InsertUserOAuthToken = z.infer<typeof insertUserOAuthTokenSchema>;
