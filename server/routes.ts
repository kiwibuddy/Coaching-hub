import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertIntakeFormSchema,
  insertSessionSchema,
  insertResourceSchema,
  insertActionItemSchema,
  insertNotificationSchema,
  insertMessageSchema,
} from "@shared/schema";
import { isAuthenticated, authStorage } from "./auth";
import type { EventAttributes } from "ics";
import {
  sendEmail,
  intakeSubmittedEmail,
  accountCreatedEmail,
  sessionScheduledEmail,
  sessionReminderEmail,
  resourceUploadedEmail,
} from "./lib/email";
import {
  createStripeCheckoutSession,
  handleStripeWebhook,
  createPayPalOrder,
  capturePayPalOrder,
  getPaymentsByClient,
  getAllPayments,
  getInvoicesByClient,
  getAllInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  isStripeEnabled,
  isPayPalEnabled,
} from "./lib/payments";
import {
  isCalendarEnabled,
  getCalendarAuthUrl,
  exchangeCalendarCode,
  saveCalendarTokens,
  hasCalendarConnected,
  disconnectCalendar,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "./lib/calendar";
import {
  getCoachOverviewMetrics,
  getMonthlyRevenue,
  getSessionsTrend,
  getClientProgressMetrics,
  getClientActivityTrend,
  getClientMetrics,
} from "./lib/analytics";

// Extend Request type to include user with role
declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
      role?: string;
      timezone?: string;
      claims?: { sub: string };
    }
  }
}

// Middleware to check if user is a coach
const requireCoach = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if ((req.user as { role?: string }).role !== "coach") {
    return res.status(403).json({ error: "Forbidden: Coach access required" });
  }
  next();
};

// Middleware to check if user is a client
const requireClient = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if ((req.user as { role?: string }).role === "coach") {
    return res.status(403).json({ error: "Forbidden: Client access required" });
  }
  next();
};

// Simple auth check
const requireAuth = isAuthenticated;

function paramId(p: string | string[]): string {
  return Array.isArray(p) ? (p[0] ?? "") : p;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============================================================
  // AUTH ROUTES
  // ============================================================
  app.get("/api/auth/user", (req, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // ============================================================
  // PUBLIC ROUTES
  // ============================================================
  // Submit intake form (public)
  app.post("/api/intake", async (req, res) => {
    try {
      const data = insertIntakeFormSchema.parse(req.body);
      const intake = await storage.createIntakeForm(data);
      
      // Notify all coaches about the new intake
      const coaches = await storage.getUsersByRole("coach");
      for (const coach of coaches) {
        if (coach.email) {
          await sendEmail(intakeSubmittedEmail(coach.email, {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            goals: data.goals,
          }));
        }
      }
      
      res.status(201).json(intake);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to submit intake form" });
      }
    }
  });

  // ============================================================
  // CLIENT ROUTES (authenticated clients only)
  // ============================================================
  app.get("/api/client/profile", requireClient, async (req, res) => {
    try {
      let profile = await storage.getClientProfile(req.user!.id);
      // Auto-create profile if it doesn't exist
      if (!profile) {
        profile = await storage.createClientProfile({
          userId: req.user!.id,
          status: "active",
        });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  app.patch("/api/client/profile", requireClient, async (req, res) => {
    try {
      const updateSchema = z.object({
        phone: z.string().optional(),
        goals: z.string().optional(),
        preferredContactMethod: z.string().optional(),
        notificationPreferences: z.string().optional(),
      });
      const data = updateSchema.parse(req.body);
      
      let profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        profile = await storage.createClientProfile({
          userId: req.user!.id,
          ...data,
        });
      } else {
        profile = await storage.updateClientProfile(profile.id, data);
      }
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update profile" });
      }
    }
  });

  // Update user timezone
  app.patch("/api/user/timezone", requireAuth, async (req, res) => {
    try {
      const updateSchema = z.object({
        timezone: z.string().min(1, "Timezone is required"),
      });
      const data = updateSchema.parse(req.body);
      
      await storage.updateUserTimezone(req.user!.id, data.timezone);
      res.json({ success: true, timezone: data.timezone });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update timezone" });
      }
    }
  });

  app.get("/api/client/sessions", requireClient, async (req, res) => {
    try {
      const profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        return res.json([]);
      }
      const sessions = await storage.getSessionsByClient(profile.id);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get sessions" });
    }
  });

  app.get("/api/client/sessions/:id", requireClient, async (req, res) => {
    try {
      // Verify ownership
      const profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const session = await storage.getSession(paramId(req.params.id));
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      // Check ownership
      if (session.clientId !== profile.id) {
        return res.status(403).json({ error: "Forbidden: Access denied" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  app.get("/api/client/sessions/:id/resources", requireClient, async (req, res) => {
    try {
      // Verify ownership
      const profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        return res.json([]);
      }
      
      const session = await storage.getSession(paramId(req.params.id));
      if (!session || session.clientId !== profile.id) {
        return res.status(403).json({ error: "Forbidden: Access denied" });
      }
      
      const resources = await storage.getResourcesBySession(paramId(req.params.id));
      res.json(resources);
    } catch (error) {
      res.status(500).json({ error: "Failed to get resources" });
    }
  });

  app.get("/api/client/sessions/:id/actions", requireClient, async (req, res) => {
    try {
      // Verify ownership
      const profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        return res.json([]);
      }
      
      const session = await storage.getSession(paramId(req.params.id));
      if (!session || session.clientId !== profile.id) {
        return res.status(403).json({ error: "Forbidden: Access denied" });
      }
      
      const actions = await storage.getActionItemsBySession(paramId(req.params.id));
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get actions" });
    }
  });

  app.patch("/api/client/sessions/:id/reflection", requireClient, async (req, res) => {
    try {
      const reflectionSchema = z.object({
        reflection: z.string().min(10),
      });
      const data = reflectionSchema.parse(req.body);
      
      // Verify ownership
      const profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const existingSession = await storage.getSession(paramId(req.params.id));
      if (!existingSession || existingSession.clientId !== profile.id) {
        return res.status(403).json({ error: "Forbidden: Access denied" });
      }
      
      const session = await storage.updateSession(paramId(req.params.id), {
        clientReflection: data.reflection,
      });
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to save reflection" });
      }
    }
  });

  app.get("/api/client/resources", requireClient, async (req, res) => {
    try {
      const profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        return res.json([]);
      }
      const resources = await storage.getResourcesByClient(profile.id);
      res.json(resources);
    } catch (error) {
      res.status(500).json({ error: "Failed to get resources" });
    }
  });

  app.get("/api/client/actions", requireClient, async (req, res) => {
    try {
      const profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        return res.json([]);
      }
      const actions = await storage.getActionItemsByClient(profile.id);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get actions" });
    }
  });

  app.patch("/api/client/actions/:id", requireClient, async (req, res) => {
    try {
      const updateSchema = z.object({
        status: z.enum(["pending", "in_progress", "completed"]),
      });
      const data = updateSchema.parse(req.body);
      
      // Verify ownership
      const profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const existingAction = await storage.getActionItem(paramId(req.params.id));
      if (!existingAction || existingAction.clientId !== profile.id) {
        return res.status(403).json({ error: "Forbidden: Access denied" });
      }
      
      const action = await storage.updateActionItem(paramId(req.params.id), data);
      res.json(action);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update action" });
      }
    }
  });

  // Client can request a new session
  app.post("/api/client/sessions", requireClient, async (req, res) => {
    try {
      const sessionRequestSchema = z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        scheduledAt: z.string().min(1, "Date and time is required"),
        duration: z.coerce.number().min(15).max(180).optional(),
        timezone: z.string().optional(),
      });
      const data = sessionRequestSchema.parse(req.body);
      
      const profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Client profile not found. Please complete your profile first." });
      }

      // Use the user's timezone to interpret the datetime
      const userTimezone = data.timezone || req.user!.timezone || "UTC";
      // The scheduledAt from datetime-local is in format "YYYY-MM-DDTHH:mm"
      // We need to interpret this in the user's timezone and convert to UTC
      const scheduledDate = new Date(data.scheduledAt + ":00");
      
      const session = await storage.createSession({
        clientId: profile.id,
        title: data.title,
        description: data.description,
        scheduledAt: scheduledDate,
        duration: data.duration || 60,
        status: "pending_confirmation",
        requestedBy: "client",
      });
      
      // Notify all coaches about the session request
      const coaches = await storage.getUsersByRole("coach");
      for (const coach of coaches) {
        await storage.createNotification({
          userId: coach.id,
          type: "session_request",
          title: "New Session Request",
          message: `A client has requested a session: "${data.title}". Please review and confirm.`,
          relatedId: session.id,
        });
        
        // Send email to coach
        if (coach.email) {
          await sendEmail(sessionScheduledEmail(
            coach.email,
            `${coach.firstName || ""} ${coach.lastName || ""}`.trim() || "Coach",
            {
              title: data.title,
              scheduledAt: scheduledDate.toISOString(),
              duration: data.duration || 60,
            },
            false // isClient = false (this is for coach)
          ));
        }
      }
      
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to request session" });
      }
    }
  });

  // Client can confirm a session requested by coach
  app.patch("/api/client/sessions/:id/confirm", requireClient, async (req, res) => {
    try {
      const profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const session = await storage.getSession(paramId(req.params.id));
      if (!session || session.clientId !== profile.id) {
        return res.status(403).json({ error: "Forbidden: Access denied" });
      }
      
      if (session.status !== "pending_confirmation") {
        return res.status(400).json({ error: "Session is not pending confirmation" });
      }
      
      if (session.requestedBy !== "coach") {
        return res.status(400).json({ error: "Only sessions requested by coach can be confirmed by client" });
      }
      
      const updated = await storage.updateSession(paramId(req.params.id), { status: "scheduled" });
      
      // Notify coach that session was confirmed
      const coaches = await storage.getUsersByRole("coach");
      for (const coach of coaches) {
        if (coach.email) {
          await sendEmail(sessionScheduledEmail(
            coach.email,
            `${coach.firstName || ""} ${coach.lastName || ""}`.trim() || "Coach",
            {
              title: session.title,
              scheduledAt: new Date(session.scheduledAt).toISOString(),
              duration: session.duration || 60,
              meetingLink: session.meetingLink || undefined,
            },
            false // isClient = false (this is for coach)
          ));
        }
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm session" });
    }
  });

  app.post("/api/client/request-deletion", requireClient, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get client profile
      const profile = await storage.getClientProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "Client profile not found" });
      }

      // Delete all client data (sessions, messages, actions, resources, etc.)
      await storage.deleteAllClientData(userId, profile.id);

      // Delete user account
      await authStorage.deleteUser(userId);

      // Destroy session and log out
      req.logout((err) => {
        if (err) {
          console.error("Logout error during deletion:", err);
        }
        req.session.destroy((sessionErr) => {
          if (sessionErr) {
            console.error("Session destroy error:", sessionErr);
          }
          res.json({ 
            success: true, 
            message: "Your account and all associated data have been permanently deleted.",
            redirectTo: "/"
          });
        });
      });
    } catch (error) {
      console.error("Data deletion error:", error);
      res.status(500).json({ error: "Failed to delete account data" });
    }
  });

  // ============================================================
  // COACH ROUTES (authenticated coaches only)
  // ============================================================
  app.get("/api/coach/clients", requireCoach, async (req, res) => {
    try {
      const clients = await storage.getAllClientProfilesWithUsers();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to get clients" });
    }
  });

  app.get("/api/coach/clients/:id", requireCoach, async (req, res) => {
    try {
      const client = await storage.getClientProfileByIdWithUser(paramId(req.params.id));
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to get client" });
    }
  });

  app.get("/api/coach/intake", requireCoach, async (req, res) => {
    try {
      const intakes = await storage.getAllIntakeForms();
      res.json(intakes);
    } catch (error) {
      res.status(500).json({ error: "Failed to get intakes" });
    }
  });

  app.patch("/api/coach/intake/:id", requireCoach, async (req, res) => {
    try {
      const updateSchema = z.object({
        status: z.enum(["pending", "accepted", "declined"]),
        coachNotes: z.string().optional(),
      });
      const data = updateSchema.parse(req.body);
      
      const existingIntake = await storage.getIntakeForm(paramId(req.params.id));
      if (!existingIntake) {
        return res.status(404).json({ error: "Intake form not found" });
      }
      
      const intake = await storage.updateIntakeForm(paramId(req.params.id), data);
      
      // When intake is accepted, create user account and client profile
      if (data.status === "accepted" && existingIntake.email) {
        // Check if user already exists with this email
        const existingUser = await authStorage.getUserByEmail(existingIntake.email);
        
        if (!existingUser) {
          // Create user account (no password - will use Google sign-in)
          const newUser = await authStorage.upsertUser({
            email: existingIntake.email,
            username: existingIntake.email,
            firstName: existingIntake.firstName,
            lastName: existingIntake.lastName,
            role: "client",
          });

          // Create client profile
          await storage.createClientProfile({
            userId: newUser.id,
            phone: existingIntake.phone || null,
            goals: existingIntake.goals,
            status: "active",
          });
        }
        
        // Send welcome email with Google sign-in instructions
        await sendEmail(accountCreatedEmail(
          existingIntake.email,
          `${existingIntake.firstName} ${existingIntake.lastName}`
        ));
      }
      
      res.json(intake);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Failed to update intake:", error);
        res.status(500).json({ error: "Failed to update intake" });
      }
    }
  });

  app.get("/api/coach/sessions", requireCoach, async (req, res) => {
    try {
      const sessions = await storage.getAllSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get sessions" });
    }
  });

  app.post("/api/coach/sessions", requireCoach, async (req, res) => {
    try {
      const sessionSchema = z.object({
        clientId: z.string().min(1, "Client is required"),
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        scheduledAt: z.string().min(1, "Date and time is required"),
        duration: z.coerce.number().min(15).max(180).optional(),
        meetingLink: z.string().optional(),
        prepNotes: z.string().optional(),
        timezone: z.string().optional(),
      });
      const data = sessionSchema.parse(req.body);

      // Use the coach's timezone to interpret the datetime
      const coachTimezone = data.timezone || req.user!.timezone || "UTC";
      // The scheduledAt from datetime-local is in format "YYYY-MM-DDTHH:mm"
      const scheduledDate = new Date(data.scheduledAt + ":00");
      
      const session = await storage.createSession({
        clientId: data.clientId,
        title: data.title,
        description: data.description,
        scheduledAt: scheduledDate,
        duration: data.duration || 60,
        meetingLink: data.meetingLink,
        prepNotes: data.prepNotes,
        status: "pending_confirmation",
        requestedBy: "coach",
      });
      
      // Get client profile and user info for email
      const clientProfile = await storage.getClientProfileById(data.clientId);
      if (clientProfile) {
        const clientUser = await authStorage.getUser(clientProfile.userId);
        
        // Create notification for client
        await storage.createNotification({
          userId: clientProfile.userId,
          type: "session_scheduled",
          title: "New Session Request",
          message: `Your coach has proposed a session "${data.title}". Please confirm.`,
          relatedId: session.id,
        });
        
        // Send email to client
        if (clientUser?.email) {
          await sendEmail(sessionScheduledEmail(
            clientUser.email,
            `${clientUser.firstName || ""} ${clientUser.lastName || ""}`.trim() || "Client",
            {
              title: data.title,
              scheduledAt: scheduledDate.toISOString(),
              duration: data.duration || 60,
              meetingLink: data.meetingLink,
            },
            true // isClient
          ));
        }
      }
      
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create session" });
      }
    }
  });

  // Coach can confirm a session requested by client
  app.patch("/api/coach/sessions/:id/confirm", requireCoach, async (req, res) => {
    try {
      const session = await storage.getSession(paramId(req.params.id));
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      if (session.status !== "pending_confirmation") {
        return res.status(400).json({ error: "Session is not pending confirmation" });
      }
      
      if (session.requestedBy !== "client") {
        return res.status(400).json({ error: "Only sessions requested by client can be confirmed by coach" });
      }
      
      const updated = await storage.updateSession(paramId(req.params.id), { status: "scheduled" });
      
      // Get client profile and user info for email
      const clientProfile = await storage.getClientProfileById(session.clientId);
      if (clientProfile) {
        const clientUser = await authStorage.getUser(clientProfile.userId);
        
        // Notify client
        await storage.createNotification({
          userId: clientProfile.userId,
          type: "session_scheduled",
          title: "Session Confirmed",
          message: `Your session "${session.title}" has been confirmed by your coach.`,
          relatedId: session.id,
        });
        
        // Send email to client
        if (clientUser?.email) {
          await sendEmail(sessionScheduledEmail(
            clientUser.email,
            `${clientUser.firstName || ""} ${clientUser.lastName || ""}`.trim() || "Client",
            {
              title: session.title,
              scheduledAt: new Date(session.scheduledAt).toISOString(),
              duration: session.duration || 60,
              meetingLink: session.meetingLink || undefined,
            },
            true // isClient
          ));
        }
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm session" });
    }
  });

  app.get("/api/coach/sessions/:id", requireCoach, async (req, res) => {
    try {
      const session = await storage.getSession(paramId(req.params.id));
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  app.patch("/api/coach/sessions/:id", requireCoach, async (req, res) => {
    try {
      const updateSchema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        scheduledAt: z.string().optional(),
        duration: z.number().optional(),
        status: z.enum(["pending_confirmation", "scheduled", "completed", "cancelled"]).optional(),
        meetingLink: z.string().optional(),
        prepNotes: z.string().optional(),
        sessionNotes: z.string().optional(),
        notesVisibleToClient: z.boolean().optional(),
      });
      const data = updateSchema.parse(req.body);
      const { scheduledAt: scheduledAtStr, ...rest } = data;
      const update = {
        ...rest,
        ...(scheduledAtStr !== undefined && { scheduledAt: new Date(scheduledAtStr) }),
      };
      const session = await storage.updateSession(paramId(req.params.id), update);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update session" });
      }
    }
  });

  app.get("/api/coach/resources", requireCoach, async (req, res) => {
    try {
      const resources = await storage.getAllResources();
      res.json(resources);
    } catch (error) {
      res.status(500).json({ error: "Failed to get resources" });
    }
  });

  app.post("/api/coach/resources", requireCoach, async (req, res) => {
    try {
      const resourceSchema = z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        fileUrl: z.string().optional(),
        fileType: z.string().optional(),
        fileName: z.string().optional(),
        sessionId: z.string().optional(),
        clientId: z.string().optional(),
        isGlobal: z.boolean().optional(),
      });
      const data = resourceSchema.parse(req.body);
      
      const resource = await storage.createResource({
        ...data,
        uploadedBy: req.user!.id,
      });
      
      // If assigned to a client, notify them
      if (data.clientId) {
        const clientProfile = await storage.getClientProfileById(data.clientId);
        if (clientProfile) {
          const clientUser = await authStorage.getUser(clientProfile.userId);
          
          await storage.createNotification({
            userId: clientProfile.userId,
            type: "resource_uploaded",
            title: "New Resource Available",
            message: `A new resource "${data.title}" has been shared with you.`,
            relatedId: resource.id,
          });
          
          // Send email to client
          if (clientUser?.email) {
            await sendEmail(resourceUploadedEmail(
              clientUser.email,
              `${clientUser.firstName || ""} ${clientUser.lastName || ""}`.trim() || "Client",
              {
                title: data.title,
                description: data.description,
              }
            ));
          }
        }
      }
      
      res.status(201).json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create resource" });
      }
    }
  });

  app.delete("/api/coach/resources/:id", requireCoach, async (req, res) => {
    try {
      await storage.deleteResource(paramId(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete resource" });
    }
  });

  app.post("/api/coach/actions", requireCoach, async (req, res) => {
    try {
      const actionSchema = z.object({
        clientId: z.string().min(1),
        sessionId: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
      });
      const data = actionSchema.parse(req.body);
      
      const action = await storage.createActionItem({
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        createdBy: req.user!.id,
      });
      
      // Notify client
      await storage.createNotification({
        userId: data.clientId,
        type: "action_assigned",
        title: "New Action Item",
        message: `A new action item "${data.title}" has been assigned to you.`,
        relatedId: action.id,
      });
      
      res.status(201).json(action);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create action" });
      }
    }
  });

  app.get("/api/coach/settings", requireCoach, async (req, res) => {
    try {
      let settings = await storage.getCoachSettings(req.user!.id);
      if (!settings) {
        settings = await storage.createOrUpdateCoachSettings(req.user!.id, {});
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  app.patch("/api/coach/settings", requireCoach, async (req, res) => {
    try {
      const settingsSchema = z.object({
        hourlyRate: z.number().min(0).optional(),
        sessionDuration: z.number().min(15).max(180).optional(),
        packageDiscount: z.number().min(0).max(100).optional(),
      });
      const data = settingsSchema.parse(req.body);
      
      const settings = await storage.createOrUpdateCoachSettings(req.user!.id, data);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update settings" });
      }
    }
  });

  // ============================================================
  // NOTIFICATION ROUTES (shared)
  // ============================================================
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      // Verify ownership of notification
      const notification = await storage.getNotification(paramId(req.params.id));
      if (!notification || notification.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden: Access denied" });
      }
      
      await storage.markNotificationRead(paramId(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification read" });
    }
  });

  app.post("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notifications read" });
    }
  });

  // ============================================================
  // MESSAGE ROUTES (shared - requires session access)
  // ============================================================
  app.get("/api/sessions/:id/messages", requireAuth, async (req, res) => {
    try {
      const session = await storage.getSession(paramId(req.params.id));
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Verify access: client can access their own sessions, coach can access all
      if (req.user!.role !== "coach") {
        const profile = await storage.getClientProfile(req.user!.id);
        if (!profile || session.clientId !== profile.id) {
          return res.status(403).json({ error: "Forbidden: Access denied" });
        }
      }

      const sessionMessages = await storage.getMessagesBySession(paramId(req.params.id));
      res.json(sessionMessages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  app.post("/api/sessions/:id/messages", requireAuth, async (req, res) => {
    try {
      const messageSchema = z.object({
        content: z.string().min(1, "Message content is required"),
      });
      const data = messageSchema.parse(req.body);

      const session = await storage.getSession(paramId(req.params.id));
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Verify access: client can access their own sessions, coach can access all
      if (req.user!.role !== "coach") {
        const profile = await storage.getClientProfile(req.user!.id);
        if (!profile || session.clientId !== profile.id) {
          return res.status(403).json({ error: "Forbidden: Access denied" });
        }
      }

      const message = await storage.createMessage({
        sessionId: paramId(req.params.id),
        senderId: req.user!.id,
        content: data.content,
      });

      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create message" });
      }
    }
  });

  // ============================================================
  // CALENDAR EXPORT ROUTES
  // ============================================================
  app.get("/api/sessions/:id/export-ics", requireAuth, async (req, res) => {
    try {
      const session = await storage.getSession(paramId(req.params.id));
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Verify access: client can access their own sessions, coach can access all
      if (req.user!.role !== "coach") {
        const profile = await storage.getClientProfile(req.user!.id);
        if (!profile || session.clientId !== profile.id) {
          return res.status(403).json({ error: "Forbidden: Access denied" });
        }
      }

      // Get client and coach info for the calendar event
      const clientProfile = await storage.getClientProfileById(session.clientId);
      const clientUser = clientProfile ? await authStorage.getUser(clientProfile.userId) : null;
      const coaches = await storage.getUsersByRole("coach");
      const coach = coaches[0]; // Use first coach for organizer

      const { createEvent } = await import("ics");

      const startDate = new Date(session.scheduledAt);
      const endDate = new Date(startDate.getTime() + (session.duration || 60) * 60 * 1000);

      const event: EventAttributes = {
        start: [
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          startDate.getDate(),
          startDate.getHours(),
          startDate.getMinutes(),
        ],
        end: [
          endDate.getFullYear(),
          endDate.getMonth() + 1,
          endDate.getDate(),
          endDate.getHours(),
          endDate.getMinutes(),
        ],
        title: session.title,
        description: session.description || "",
        location: session.meetingLink || "",
        url: session.meetingLink || undefined,
        organizer: coach ? {
          name: `${coach.firstName || ""} ${coach.lastName || ""}`.trim() || "Coach",
          email: coach.email || "coach@holgercoaching.com",
        } : undefined,
        attendees: clientUser ? [{
          name: `${clientUser.firstName || ""} ${clientUser.lastName || ""}`.trim() || "Client",
          email: clientUser.email || "client@example.com",
        }] : undefined,
        status: "CONFIRMED",
        busyStatus: "BUSY",
      };

      const { error, value } = createEvent(event);

      if (error) {
        throw error;
      }

      if (!value) {
        return res.status(500).json({ error: "Failed to generate calendar file" });
      }

      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="session-${session.id}.ics"`);
      res.send(value);
    } catch (error) {
      console.error("Error exporting calendar:", error);
      res.status(500).json({ error: "Failed to export calendar" });
    }
  });

  // ============================================================
  // UPLOAD ROUTES
  // ============================================================
  // Upload routes are handled by registerObjectStorageRoutes in server/index.ts
  // Routes: /api/uploads/request-url and /objects/:objectPath(*)

  // ============================================================
  // PAYMENT ROUTES
  // ============================================================
  
  // Get payment providers status
  app.get("/api/payments/providers", requireAuth, (req, res) => {
    res.json({
      stripe: isStripeEnabled(),
      paypal: isPayPalEnabled(),
    });
  });

  // Create Stripe checkout session
  app.post("/api/payments/stripe/checkout", requireAuth, async (req, res) => {
    try {
      if (!isStripeEnabled()) {
        return res.status(503).json({ error: "Stripe is not configured" });
      }

      const schema = z.object({
        amount: z.number().min(100), // Minimum $1.00
        description: z.string(),
        sessionId: z.string().optional(),
        invoiceId: z.string().optional(),
      });
      const data = schema.parse(req.body);

      // Get client profile
      const profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Client profile not found" });
      }

      const result = await createStripeCheckoutSession({
        clientId: profile.id,
        amount: data.amount,
        description: data.description,
        sessionId: data.sessionId,
        invoiceId: data.invoiceId,
        successUrl: `${process.env.APP_URL}/client/billing?success=true`,
        cancelUrl: `${process.env.APP_URL}/client/billing?cancelled=true`,
      });

      if (!result) {
        return res.status(500).json({ error: "Failed to create checkout session" });
      }

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Stripe checkout error:", error);
        res.status(500).json({ error: "Failed to create checkout session" });
      }
    }
  });

  // Stripe webhook (no auth - verified by signature)
  app.post("/api/webhooks/stripe", async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;
    if (!signature) {
      return res.status(400).json({ error: "Missing signature" });
    }

    const result = await handleStripeWebhook(req.rawBody as Buffer, signature);
    if (result.success) {
      res.json({ received: true, paymentId: result.paymentId });
    } else {
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });

  // Create PayPal order
  app.post("/api/payments/paypal/create-order", requireAuth, async (req, res) => {
    try {
      if (!isPayPalEnabled()) {
        return res.status(503).json({ error: "PayPal is not configured" });
      }

      const schema = z.object({
        amount: z.number().min(100),
        description: z.string(),
        sessionId: z.string().optional(),
        invoiceId: z.string().optional(),
      });
      const data = schema.parse(req.body);

      const profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Client profile not found" });
      }

      const result = await createPayPalOrder({
        clientId: profile.id,
        amount: data.amount,
        description: data.description,
        sessionId: data.sessionId,
        invoiceId: data.invoiceId,
      });

      if (!result) {
        return res.status(500).json({ error: "Failed to create PayPal order" });
      }

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("PayPal order error:", error);
        res.status(500).json({ error: "Failed to create PayPal order" });
      }
    }
  });

  // Capture PayPal order (callback from PayPal)
  app.get("/api/payments/paypal/capture", async (req, res) => {
    try {
      const orderId = req.query.token as string;
      if (!orderId) {
        return res.redirect("/client/billing?error=missing_order");
      }

      const result = await capturePayPalOrder(orderId);
      if (result.success) {
        res.redirect("/client/billing?success=true");
      } else {
        res.redirect("/client/billing?error=capture_failed");
      }
    } catch (error) {
      console.error("PayPal capture error:", error);
      res.redirect("/client/billing?error=capture_failed");
    }
  });

  // Get client payments
  app.get("/api/client/payments", requireClient, async (req, res) => {
    try {
      const profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        return res.json([]);
      }
      const payments = await getPaymentsByClient(profile.id);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get payments" });
    }
  });

  // Get client invoices
  app.get("/api/client/invoices", requireClient, async (req, res) => {
    try {
      const profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        return res.json([]);
      }
      const invoices = await getInvoicesByClient(profile.id);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to get invoices" });
    }
  });

  // Coach: Get all payments
  app.get("/api/coach/payments", requireCoach, async (req, res) => {
    try {
      const payments = await getAllPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get payments" });
    }
  });

  // Coach: Get all invoices
  app.get("/api/coach/invoices", requireCoach, async (req, res) => {
    try {
      const invoices = await getAllInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to get invoices" });
    }
  });

  // Coach: Create invoice
  app.post("/api/coach/invoices", requireCoach, async (req, res) => {
    try {
      const schema = z.object({
        clientId: z.string(),
        amount: z.number().min(1),
        dueDate: z.string().optional(),
        items: z.string(), // JSON array
        notes: z.string().optional(),
      });
      const data = schema.parse(req.body);

      const invoice = await createInvoice({
        clientId: data.clientId,
        amount: data.amount,
        currency: "usd",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        items: data.items,
        notes: data.notes,
      });

      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create invoice" });
      }
    }
  });

  // Coach: Update invoice
  app.patch("/api/coach/invoices/:id", requireCoach, async (req, res) => {
    try {
      const schema = z.object({
        status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
        notes: z.string().optional(),
      });
      const data = schema.parse(req.body);

      const invoice = await updateInvoice(paramId(req.params.id), data);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update invoice" });
      }
    }
  });

  // ============================================================
  // CALENDAR SYNC ROUTES
  // ============================================================

  // Check if calendar sync is available
  app.get("/api/calendar/status", requireAuth, async (req, res) => {
    try {
      const enabled = isCalendarEnabled();
      const connected = enabled ? await hasCalendarConnected(req.user!.id) : false;
      res.json({ enabled, connected });
    } catch (error) {
      res.status(500).json({ error: "Failed to get calendar status" });
    }
  });

  // Start Google Calendar OAuth flow
  app.get("/api/auth/google-calendar", requireAuth, (req, res) => {
    if (!isCalendarEnabled()) {
      return res.status(503).json({ error: "Google Calendar is not configured" });
    }

    // Encode user ID in state for callback
    const state = Buffer.from(JSON.stringify({ userId: req.user!.id })).toString("base64");
    const authUrl = getCalendarAuthUrl(state);
    res.redirect(authUrl);
  });

  // Google Calendar OAuth callback
  app.get("/api/auth/google-calendar/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code || !state) {
        return res.redirect("/client/profile?calendar_error=missing_params");
      }

      // Decode state to get user ID
      const stateData = JSON.parse(Buffer.from(state as string, "base64").toString());
      const userId = stateData.userId;

      if (!userId) {
        return res.redirect("/client/profile?calendar_error=invalid_state");
      }

      // Exchange code for tokens
      const tokens = await exchangeCalendarCode(code as string);
      await saveCalendarTokens(userId, tokens);

      res.redirect("/client/profile?calendar_connected=true");
    } catch (error) {
      console.error("Calendar OAuth error:", error);
      res.redirect("/client/profile?calendar_error=oauth_failed");
    }
  });

  // Disconnect Google Calendar
  app.delete("/api/calendar/disconnect", requireAuth, async (req, res) => {
    try {
      await disconnectCalendar(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to disconnect calendar" });
    }
  });

  // Sync session to Google Calendar
  app.post("/api/sessions/:id/sync-calendar", requireAuth, async (req, res) => {
    try {
      const sessionId = paramId(req.params.id);
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Create or update calendar event
      if (session.googleCalendarEventId) {
        const success = await updateCalendarEvent(req.user!.id, session.googleCalendarEventId, {
          id: session.id,
          title: session.title,
          description: session.description,
          scheduledAt: session.scheduledAt,
          duration: session.duration || 60,
          meetingLink: session.meetingLink,
        });
        res.json({ success, eventId: session.googleCalendarEventId });
      } else {
        const eventId = await createCalendarEvent(req.user!.id, {
          id: session.id,
          title: session.title,
          description: session.description,
          scheduledAt: session.scheduledAt,
          duration: session.duration || 60,
          meetingLink: session.meetingLink,
        });
        res.json({ success: !!eventId, eventId });
      }
    } catch (error) {
      console.error("Calendar sync error:", error);
      res.status(500).json({ error: "Failed to sync to calendar" });
    }
  });

  // Remove session from Google Calendar
  app.delete("/api/sessions/:id/sync-calendar", requireAuth, async (req, res) => {
    try {
      const sessionId = paramId(req.params.id);
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (!session.googleCalendarEventId) {
        return res.status(400).json({ error: "Session is not synced to calendar" });
      }

      const success = await deleteCalendarEvent(
        req.user!.id,
        session.googleCalendarEventId,
        sessionId
      );
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from calendar" });
    }
  });

  // ============================================================
  // ANALYTICS ROUTES
  // ============================================================

  // Coach: Get practice overview metrics
  app.get("/api/coach/analytics", requireCoach, async (req, res) => {
    try {
      const metrics = await getCoachOverviewMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });

  // Coach: Get revenue over time
  app.get("/api/coach/analytics/revenue", requireCoach, async (req, res) => {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const data = await getMonthlyRevenue(months);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to get revenue data" });
    }
  });

  // Coach: Get sessions trend
  app.get("/api/coach/analytics/sessions", requireCoach, async (req, res) => {
    try {
      const weeks = parseInt(req.query.weeks as string) || 8;
      const data = await getSessionsTrend(weeks);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to get sessions trend" });
    }
  });

  // Coach: Get per-client metrics
  app.get("/api/coach/clients/:id/analytics", requireCoach, async (req, res) => {
    try {
      const clientId = paramId(req.params.id);
      const metrics = await getClientMetrics(clientId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to get client metrics" });
    }
  });

  // Client: Get personal progress metrics
  app.get("/api/client/analytics", requireClient, async (req, res) => {
    try {
      const profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Client profile not found" });
      }
      const metrics = await getClientProgressMetrics(profile.id);
      res.json(metrics);
    } catch (error) {
      console.error("Client analytics error:", error);
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });

  // Client: Get activity trend
  app.get("/api/client/analytics/activity", requireClient, async (req, res) => {
    try {
      const profile = await storage.getClientProfile(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Client profile not found" });
      }
      const months = parseInt(req.query.months as string) || 6;
      const data = await getClientActivityTrend(profile.id, months);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to get activity trend" });
    }
  });

  return httpServer;
}
