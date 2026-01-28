import { db } from "../db";
import { coachingSessions, users, clientProfiles } from "@shared/schema";
import { eq, and, isNull, gte, lte } from "drizzle-orm";
import { sendEmail, sessionReminderEmail } from "../lib/email";
import { format, addHours, subHours } from "date-fns";

/**
 * Session Reminder Job
 * Sends reminder emails for sessions scheduled in the next 24 hours
 * that haven't already been reminded.
 */
export async function runSessionReminders(): Promise<{
  processed: number;
  sent: number;
  errors: number;
}> {
  const now = new Date();
  const in24Hours = addHours(now, 24);

  console.log(`[SessionReminders] Running job at ${now.toISOString()}`);

  try {
    // Find sessions scheduled in the next 24 hours that haven't been reminded
    const upcomingSessions = await db.select({
      session: coachingSessions,
    })
    .from(coachingSessions)
    .where(
      and(
        eq(coachingSessions.status, "scheduled"),
        gte(coachingSessions.scheduledAt, now),
        lte(coachingSessions.scheduledAt, in24Hours),
        isNull(coachingSessions.reminderSentAt)
      )
    );

    console.log(`[SessionReminders] Found ${upcomingSessions.length} sessions needing reminders`);

    let sent = 0;
    let errors = 0;

    for (const { session } of upcomingSessions) {
      try {
        // Get client profile and user
        const [clientProfile] = await db.select()
          .from(clientProfiles)
          .where(eq(clientProfiles.id, session.clientId));

        if (!clientProfile) {
          console.warn(`[SessionReminders] No client profile found for session ${session.id}`);
          errors++;
          continue;
        }

        const [clientUser] = await db.select()
          .from(users)
          .where(eq(users.id, clientProfile.userId));

        if (!clientUser || !clientUser.email) {
          console.warn(`[SessionReminders] No user/email found for session ${session.id}`);
          errors++;
          continue;
        }

        // Send reminder email
        const emailOptions = sessionReminderEmail(
          clientUser.email,
          clientUser.firstName || "Client",
          {
            title: session.title,
            scheduledAt: format(session.scheduledAt, "EEEE, MMMM d, yyyy 'at' h:mm a"),
            duration: session.duration || 60,
            meetingLink: session.meetingLink || undefined,
          }
        );

        const success = await sendEmail(emailOptions);

        if (success) {
          // Mark session as reminded
          await db.update(coachingSessions)
            .set({ reminderSentAt: now, updatedAt: now })
            .where(eq(coachingSessions.id, session.id));
          sent++;
          console.log(`[SessionReminders] Sent reminder for session ${session.id} to ${clientUser.email}`);
        } else {
          errors++;
          console.warn(`[SessionReminders] Failed to send reminder for session ${session.id}`);
        }
      } catch (err) {
        console.error(`[SessionReminders] Error processing session ${session.id}:`, err);
        errors++;
      }
    }

    console.log(`[SessionReminders] Job complete: ${sent} sent, ${errors} errors`);
    return { processed: upcomingSessions.length, sent, errors };
  } catch (err) {
    console.error("[SessionReminders] Job failed:", err);
    return { processed: 0, sent: 0, errors: 1 };
  }
}

// Scheduler setup
let reminderInterval: NodeJS.Timeout | null = null;

export function startSessionReminderScheduler(intervalMs: number = 60 * 60 * 1000): void {
  // Default: run every hour
  if (reminderInterval) {
    console.warn("[SessionReminders] Scheduler already running");
    return;
  }

  console.log(`[SessionReminders] Starting scheduler with ${intervalMs / 1000}s interval`);

  // Run immediately on startup
  runSessionReminders().catch(console.error);

  // Then run at regular intervals
  reminderInterval = setInterval(() => {
    runSessionReminders().catch(console.error);
  }, intervalMs);
}

export function stopSessionReminderScheduler(): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    console.log("[SessionReminders] Scheduler stopped");
  }
}
