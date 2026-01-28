import { google, calendar_v3 } from "googleapis";
import { db } from "../db";
import { userOAuthTokens, coachingSessions, type UserOAuthToken } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// OAuth2 client configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL}/api/auth/google-calendar/callback`
);

const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

// Check if Google Calendar is configured
export function isCalendarEnabled(): boolean {
  return !!(
    (process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID) &&
    (process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET)
  );
}

// Generate OAuth consent URL
export function getCalendarAuthUrl(state: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: CALENDAR_SCOPES,
    state,
    prompt: "consent", // Force to get refresh token
  });
}

// Exchange authorization code for tokens
export async function exchangeCalendarCode(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}> {
  const { tokens } = await oauth2Client.getToken(code);
  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token || undefined,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
  };
}

// Save or update OAuth tokens
export async function saveCalendarTokens(
  userId: string,
  tokens: { accessToken: string; refreshToken?: string; expiresAt?: Date }
): Promise<void> {
  const existing = await db.select()
    .from(userOAuthTokens)
    .where(and(
      eq(userOAuthTokens.userId, userId),
      eq(userOAuthTokens.provider, "google_calendar")
    ));

  if (existing.length > 0) {
    await db.update(userOAuthTokens)
      .set({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || existing[0].refreshToken,
        expiresAt: tokens.expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(userOAuthTokens.id, existing[0].id));
  } else {
    await db.insert(userOAuthTokens).values({
      userId,
      provider: "google_calendar",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      scope: CALENDAR_SCOPES.join(" "),
    });
  }
}

// Get OAuth tokens for a user
export async function getCalendarTokens(userId: string): Promise<UserOAuthToken | null> {
  const [token] = await db.select()
    .from(userOAuthTokens)
    .where(and(
      eq(userOAuthTokens.userId, userId),
      eq(userOAuthTokens.provider, "google_calendar")
    ));
  return token || null;
}

// Check if user has calendar connected
export async function hasCalendarConnected(userId: string): Promise<boolean> {
  const token = await getCalendarTokens(userId);
  return !!token;
}

// Remove calendar connection
export async function disconnectCalendar(userId: string): Promise<void> {
  await db.delete(userOAuthTokens)
    .where(and(
      eq(userOAuthTokens.userId, userId),
      eq(userOAuthTokens.provider, "google_calendar")
    ));
}

// Get authenticated Google Calendar client
async function getCalendarClient(userId: string): Promise<calendar_v3.Calendar | null> {
  const tokens = await getCalendarTokens(userId);
  if (!tokens) return null;

  // Check if token is expired
  if (tokens.expiresAt && tokens.expiresAt < new Date()) {
    // Try to refresh
    if (tokens.refreshToken) {
      oauth2Client.setCredentials({ refresh_token: tokens.refreshToken });
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      await saveCalendarTokens(userId, {
        accessToken: credentials.access_token!,
        refreshToken: credentials.refresh_token || tokens.refreshToken,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
      });
      
      oauth2Client.setCredentials({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || tokens.refreshToken,
      });
    } else {
      // Cannot refresh, user needs to reconnect
      return null;
    }
  } else {
    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

// Create calendar event for a session
export async function createCalendarEvent(
  userId: string,
  session: {
    id: string;
    title: string;
    description?: string | null;
    scheduledAt: Date;
    duration: number;
    meetingLink?: string | null;
  }
): Promise<string | null> {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return null;

  try {
    const endTime = new Date(session.scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + (session.duration || 60));

    const event: calendar_v3.Schema$Event = {
      summary: session.title,
      description: session.description || undefined,
      start: {
        dateTime: session.scheduledAt.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "UTC",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 30 }, // 30 min before
        ],
      },
    };

    // Add conference data if meeting link exists
    if (session.meetingLink) {
      event.description = `${event.description || ""}\n\nMeeting Link: ${session.meetingLink}`;
    }

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    // Update session with calendar event ID
    if (response.data.id) {
      await db.update(coachingSessions)
        .set({
          googleCalendarEventId: response.data.id,
          calendarSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(coachingSessions.id, session.id));
    }

    return response.data.id || null;
  } catch (error) {
    console.error("Failed to create calendar event:", error);
    return null;
  }
}

// Update calendar event
export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  session: {
    id: string;
    title: string;
    description?: string | null;
    scheduledAt: Date;
    duration: number;
    meetingLink?: string | null;
  }
): Promise<boolean> {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return false;

  try {
    const endTime = new Date(session.scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + (session.duration || 60));

    const event: calendar_v3.Schema$Event = {
      summary: session.title,
      description: session.description || undefined,
      start: {
        dateTime: session.scheduledAt.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "UTC",
      },
    };

    if (session.meetingLink) {
      event.description = `${event.description || ""}\n\nMeeting Link: ${session.meetingLink}`;
    }

    await calendar.events.update({
      calendarId: "primary",
      eventId,
      requestBody: event,
    });

    await db.update(coachingSessions)
      .set({
        calendarSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(coachingSessions.id, session.id));

    return true;
  } catch (error) {
    console.error("Failed to update calendar event:", error);
    return false;
  }
}

// Delete calendar event
export async function deleteCalendarEvent(
  userId: string,
  eventId: string,
  sessionId: string
): Promise<boolean> {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return false;

  try {
    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });

    await db.update(coachingSessions)
      .set({
        googleCalendarEventId: null,
        calendarSyncedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(coachingSessions.id, sessionId));

    return true;
  } catch (error) {
    console.error("Failed to delete calendar event:", error);
    return false;
  }
}
