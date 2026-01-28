import { db } from "./db";
import { eq, and, or, desc, inArray } from "drizzle-orm";
import {
  users,
  clientProfiles,
  intakeForms,
  coachingSessions,
  resources,
  actionItems,
  notifications,
  messages,
  testimonials,
  coachSettings,
  payments,
  invoices,
  userOAuthTokens,
  type User,
  type ClientProfile,
  type InsertClientProfile,
  type IntakeForm,
  type InsertIntakeForm,
  type Session,
  type InsertSession,
  type Resource,
  type InsertResource,
  type ActionItem,
  type InsertActionItem,
  type Notification,
  type InsertNotification,
  type Message,
  type InsertMessage,
  type Testimonial,
  type InsertTestimonial,
  type CoachSettings,
  type InsertCoachSettings,
} from "@shared/schema";

export interface IStorage {
  // Client Profiles
  getClientProfile(userId: string): Promise<ClientProfile | undefined>;
  getClientProfileById(id: string): Promise<ClientProfile | undefined>;
  createClientProfile(profile: InsertClientProfile): Promise<ClientProfile>;
  updateClientProfile(id: string, profile: Partial<InsertClientProfile>): Promise<ClientProfile | undefined>;
  getAllClientProfiles(): Promise<ClientProfile[]>;

  // Intake Forms
  getIntakeForm(id: string): Promise<IntakeForm | undefined>;
  createIntakeForm(form: InsertIntakeForm): Promise<IntakeForm>;
  updateIntakeForm(id: string, data: Partial<IntakeForm>): Promise<IntakeForm | undefined>;
  getAllIntakeForms(): Promise<IntakeForm[]>;
  getPendingIntakeForms(): Promise<IntakeForm[]>;

  // Sessions
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, session: Partial<Session>): Promise<Session | undefined>;
  getSessionsByClient(clientId: string): Promise<Session[]>;
  getAllSessions(): Promise<Session[]>;

  // Resources
  getResource(id: string): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  deleteResource(id: string): Promise<boolean>;
  getResourcesByClient(clientId: string): Promise<Resource[]>;
  getResourcesBySession(sessionId: string): Promise<Resource[]>;
  getAllResources(): Promise<Resource[]>;

  // Action Items
  getActionItem(id: string): Promise<ActionItem | undefined>;
  createActionItem(item: InsertActionItem): Promise<ActionItem>;
  updateActionItem(id: string, item: Partial<ActionItem>): Promise<ActionItem | undefined>;
  getActionItemsByClient(clientId: string): Promise<ActionItem[]>;
  getActionItemsBySession(sessionId: string): Promise<ActionItem[]>;
  getAllActionItems(): Promise<ActionItem[]>;

  // Notifications
  getNotification(id: string): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;

  // Coach Settings
  getCoachSettings(userId: string): Promise<CoachSettings | undefined>;
  createOrUpdateCoachSettings(userId: string, settings: Partial<InsertCoachSettings>): Promise<CoachSettings>;

  // Users
  getUsersByRole(role: string): Promise<User[]>;
  updateUserTimezone(userId: string, timezone: string): Promise<void>;

  // Messages
  getMessagesBySession(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  // Client Profiles
  async getClientProfile(userId: string): Promise<ClientProfile | undefined> {
    const [profile] = await db.select().from(clientProfiles).where(eq(clientProfiles.userId, userId));
    return profile;
  }

  async getClientProfileById(id: string): Promise<ClientProfile | undefined> {
    const [profile] = await db.select().from(clientProfiles).where(eq(clientProfiles.id, id));
    return profile;
  }

  async createClientProfile(profile: InsertClientProfile): Promise<ClientProfile> {
    const [created] = await db.insert(clientProfiles).values(profile).returning();
    return created;
  }

  async updateClientProfile(id: string, profile: Partial<InsertClientProfile>): Promise<ClientProfile | undefined> {
    const [updated] = await db.update(clientProfiles).set({ ...profile, updatedAt: new Date() }).where(eq(clientProfiles.id, id)).returning();
    return updated;
  }

  async getAllClientProfiles(): Promise<ClientProfile[]> {
    return db.select().from(clientProfiles).orderBy(desc(clientProfiles.createdAt));
  }

  async getAllClientProfilesWithUsers() {
    const results = await db
      .select({
        profile: clientProfiles,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(clientProfiles)
      .leftJoin(users, eq(clientProfiles.userId, users.id))
      .orderBy(desc(clientProfiles.createdAt));
    
    return results.map(r => ({ ...r.profile, user: r.user }));
  }

  async getClientProfileByIdWithUser(id: string) {
    const [result] = await db
      .select({
        profile: clientProfiles,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(clientProfiles)
      .leftJoin(users, eq(clientProfiles.userId, users.id))
      .where(eq(clientProfiles.id, id));
    
    if (!result) return undefined;
    return { ...result.profile, user: result.user };
  }

  // Intake Forms
  async getIntakeForm(id: string): Promise<IntakeForm | undefined> {
    const [form] = await db.select().from(intakeForms).where(eq(intakeForms.id, id));
    return form;
  }

  async createIntakeForm(form: InsertIntakeForm): Promise<IntakeForm> {
    const [created] = await db.insert(intakeForms).values(form).returning();
    return created;
  }

  async updateIntakeForm(id: string, data: Partial<IntakeForm>): Promise<IntakeForm | undefined> {
    const [updated] = await db.update(intakeForms).set({ ...data, reviewedAt: new Date() }).where(eq(intakeForms.id, id)).returning();
    return updated;
  }

  async getAllIntakeForms(): Promise<IntakeForm[]> {
    return db.select().from(intakeForms).orderBy(desc(intakeForms.createdAt));
  }

  async getPendingIntakeForms(): Promise<IntakeForm[]> {
    return db.select().from(intakeForms).where(eq(intakeForms.status, "pending")).orderBy(desc(intakeForms.createdAt));
  }

  // Sessions
  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(coachingSessions).where(eq(coachingSessions.id, id));
    return session;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [created] = await db.insert(coachingSessions).values(session).returning();
    return created;
  }

  async updateSession(id: string, session: Partial<Session>): Promise<Session | undefined> {
    const [updated] = await db.update(coachingSessions).set({ ...session, updatedAt: new Date() }).where(eq(coachingSessions.id, id)).returning();
    return updated;
  }

  async getSessionsByClient(clientId: string): Promise<Session[]> {
    return db.select().from(coachingSessions).where(eq(coachingSessions.clientId, clientId)).orderBy(desc(coachingSessions.scheduledAt));
  }

  async getAllSessions(): Promise<Session[]> {
    return db.select().from(coachingSessions).orderBy(desc(coachingSessions.scheduledAt));
  }

  // Resources
  async getResource(id: string): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [created] = await db.insert(resources).values(resource).returning();
    return created;
  }

  async deleteResource(id: string): Promise<boolean> {
    const result = await db.delete(resources).where(eq(resources.id, id));
    return true;
  }

  async getResourcesByClient(clientId: string): Promise<Resource[]> {
    return db.select().from(resources).where(
      or(eq(resources.clientId, clientId), eq(resources.isGlobal, true))
    ).orderBy(desc(resources.createdAt));
  }

  async getResourcesBySession(sessionId: string): Promise<Resource[]> {
    return db.select().from(resources).where(eq(resources.sessionId, sessionId)).orderBy(desc(resources.createdAt));
  }

  async getAllResources(): Promise<Resource[]> {
    return db.select().from(resources).orderBy(desc(resources.createdAt));
  }

  // Action Items
  async getActionItem(id: string): Promise<ActionItem | undefined> {
    const [item] = await db.select().from(actionItems).where(eq(actionItems.id, id));
    return item;
  }

  async createActionItem(item: InsertActionItem): Promise<ActionItem> {
    const [created] = await db.insert(actionItems).values(item).returning();
    return created;
  }

  async updateActionItem(id: string, item: Partial<ActionItem>): Promise<ActionItem | undefined> {
    const updateData: Partial<ActionItem> = { ...item, updatedAt: new Date() };
    if (item.status === "completed" && !item.completedAt) {
      updateData.completedAt = new Date();
    }
    const [updated] = await db.update(actionItems).set(updateData).where(eq(actionItems.id, id)).returning();
    return updated;
  }

  async getActionItemsByClient(clientId: string): Promise<ActionItem[]> {
    return db.select().from(actionItems).where(eq(actionItems.clientId, clientId)).orderBy(desc(actionItems.createdAt));
  }

  async getActionItemsBySession(sessionId: string): Promise<ActionItem[]> {
    return db.select().from(actionItems).where(eq(actionItems.sessionId, sessionId)).orderBy(desc(actionItems.createdAt));
  }

  async getAllActionItems(): Promise<ActionItem[]> {
    return db.select().from(actionItems).orderBy(desc(actionItems.createdAt));
  }

  // Notifications
  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  // Coach Settings
  async getCoachSettings(userId: string): Promise<CoachSettings | undefined> {
    const [settings] = await db.select().from(coachSettings).where(eq(coachSettings.userId, userId));
    return settings;
  }

  async createOrUpdateCoachSettings(userId: string, settings: Partial<InsertCoachSettings>): Promise<CoachSettings> {
    const existing = await this.getCoachSettings(userId);
    if (existing) {
      const [updated] = await db.update(coachSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(coachSettings.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(coachSettings)
        .values({ ...settings, userId })
        .returning();
      return created;
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  async updateUserTimezone(userId: string, timezone: string): Promise<void> {
    await db.update(users)
      .set({ timezone, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Messages
  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    return db.select().from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  // Data Deletion (GDPR compliance)
  async deleteAllClientData(userId: string, clientProfileId: string): Promise<void> {
    // Get all session IDs for this client to delete related messages
    const clientSessions = await db.select({ id: coachingSessions.id })
      .from(coachingSessions)
      .where(eq(coachingSessions.clientId, clientProfileId));
    const sessionIds = clientSessions.map(s => s.id);

    // Delete in order (respecting foreign key constraints):
    // 1. Messages (via sessions)
    if (sessionIds.length > 0) {
      await db.delete(messages).where(inArray(messages.sessionId, sessionIds));
    }

    // 2. Action items
    await db.delete(actionItems).where(eq(actionItems.clientId, clientProfileId));

    // 3. Resources (note: files in GCS would need separate cleanup)
    await db.delete(resources).where(eq(resources.clientId, clientProfileId));

    // 4. Sessions
    await db.delete(coachingSessions).where(eq(coachingSessions.clientId, clientProfileId));

    // 5. Payments
    await db.delete(payments).where(eq(payments.clientId, clientProfileId));

    // 6. Invoices
    await db.delete(invoices).where(eq(invoices.clientId, clientProfileId));

    // 7. Notifications
    await db.delete(notifications).where(eq(notifications.userId, userId));

    // 8. OAuth tokens
    await db.delete(userOAuthTokens).where(eq(userOAuthTokens.userId, userId));

    // 9. Client profile
    await db.delete(clientProfiles).where(eq(clientProfiles.id, clientProfileId));

    // 10. User account (handled by authStorage.deleteUser)
  }
}

export const storage = new DatabaseStorage();
