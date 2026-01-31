/**
 * Seed script: creates demo coach and 8 clients with robust demo data (~6 months
 * of operation: varied tenure, 1 pending intake, sessions, action items, resources).
 *
 * Run: npm run db:seed
 *
 * Demo credentials (password for all): demo123
 * - Coach: coach@example.com
 * - Clients: client@example.com, nathanielbaldock@gmail.com, alex@demo.com, jordan@demo.com,
 *   sam@demo.com, morgan@demo.com, casey@demo.com, riley@demo.com
 * - 1 pending intake: Jamie Rivera
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { authStorage } from "../server/auth/storage";
import { storage } from "../server/storage";
import { db } from "../server/db";
import { payments, invoices } from "@shared/schema";
import type { ClientProfile } from "@shared/schema";
import { subDays, addDays, subWeeks, subMonths, addHours } from "date-fns";

const DEMO_PASSWORD = "demo123";
const COACH_EMAIL = "coach@example.com";
const CLIENT_EMAIL = "client@example.com";

type ClientSeed = {
  email: string;
  firstName: string;
  lastName: string;
  goals: string;
  phone?: string;
  tenure: "6months" | "4months" | "2months" | "1month" | "new" | "dev";
};

async function ensureClient(
  hashedPassword: string,
  coachId: string,
  def: ClientSeed
): Promise<{ user: { id: string }; profile: ClientProfile }> {
  let user = await authStorage.getUserByEmail(def.email);
  if (!user) {
    user = await authStorage.upsertUser({
      email: def.email,
      username: def.email,
      password: hashedPassword,
      firstName: def.firstName,
      lastName: def.lastName,
      role: "client",
      emailVerified: true,
    });
  } else {
    await authStorage.upsertUser({
      id: user.id,
      email: user.email,
      username: user.username,
      password: hashedPassword,
      firstName: def.firstName,
      lastName: def.lastName,
      role: "client",
      emailVerified: true,
    });
  }
  let profile = await storage.getClientProfile(user!.id);
  if (!profile) {
    profile = await storage.createClientProfile({
      userId: user!.id,
      status: "active",
      phone: def.phone ?? "+1 (555) 000-0000",
      goals: def.goals,
      preferredContactMethod: "email",
    });
  }
  return { user: user!, profile };
}

async function seed() {
  console.log("Starting comprehensive seed...\n");
  
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ----- Coach -----
  let coach = await authStorage.getUserByEmail(COACH_EMAIL);
  if (!coach) {
    coach = await authStorage.upsertUser({
      email: COACH_EMAIL,
      username: COACH_EMAIL,
      password: hashedPassword,
      firstName: "Demo",
      lastName: "Coach",
      role: "coach",
      emailVerified: true, // Demo account – skip verification for local/testing
    });
    console.log("✓ Created coach:", COACH_EMAIL);
  } else {
    await authStorage.upsertUser({
      id: coach.id,
      email: coach.email,
      username: coach.username,
      password: hashedPassword,
      firstName: coach.firstName ?? "Demo",
      lastName: coach.lastName ?? "Coach",
      role: "coach",
      emailVerified: true, // Demo account – skip verification for local/testing
    });
    console.log("✓ Updated coach password:", COACH_EMAIL);
  }

  // ----- Client -----
  let client = await authStorage.getUserByEmail(CLIENT_EMAIL);
  if (!client) {
    client = await authStorage.upsertUser({
      email: CLIENT_EMAIL,
      username: CLIENT_EMAIL,
      password: hashedPassword,
      firstName: "Demo",
      lastName: "Client",
      role: "client",
      emailVerified: true, // Demo account – skip verification for local/testing
    });
    console.log("✓ Created client:", CLIENT_EMAIL);
  } else {
    await authStorage.upsertUser({
      id: client.id,
      email: client.email,
      username: client.username,
      password: hashedPassword,
      firstName: client.firstName ?? "Demo",
      lastName: client.lastName ?? "Client",
      role: "client",
      emailVerified: true, // Demo account – skip verification for local/testing
    });
    console.log("✓ Updated client password:", CLIENT_EMAIL);
  }

  // ----- Client profile -----
  let clientProfile = await storage.getClientProfile(client.id);
  if (!clientProfile) {
    clientProfile = await storage.createClientProfile({
      userId: client.id,
      status: "active",
      phone: "+1 (555) 123-4567",
      goals: "Build leadership skills, improve work-life balance, and develop a strategic career roadmap for the next 5 years.",
      preferredContactMethod: "email",
    });
    console.log("✓ Created client profile");
  }

  // ----- Dev login (nathanielbaldock@gmail.com) so you can log in at localhost:3001 -----
  const DEV_EMAIL = "nathanielbaldock@gmail.com";
  let devUser = await authStorage.getUserByEmail(DEV_EMAIL);
  if (!devUser) {
    devUser = await authStorage.upsertUser({
      email: DEV_EMAIL,
      username: DEV_EMAIL,
      password: hashedPassword,
      firstName: "Nathaniel",
      lastName: "Baldock",
      role: "client",
      emailVerified: true,
    });
    console.log("✓ Created dev login:", DEV_EMAIL, "(password: demo123)");
  } else {
    await authStorage.upsertUser({
      id: devUser.id,
      email: devUser.email,
      username: devUser.username,
      password: hashedPassword,
      firstName: devUser.firstName ?? "Nathaniel",
      lastName: devUser.lastName ?? "Baldock",
      role: devUser.role ?? "client",
      emailVerified: true,
    });
    console.log("✓ Updated dev login:", DEV_EMAIL, "(password: demo123)");
  }
  let devProfile = await storage.getClientProfile(devUser!.id);
  if (!devProfile) {
    devProfile = await storage.createClientProfile({
      userId: devUser!.id,
      status: "active",
      goals: "Dev account for testing the portal.",
      preferredContactMethod: "email",
    });
    console.log("✓ Created client profile for", DEV_EMAIL);
  }

  // ----- 6 additional demo clients (8 total with Demo Client + dev) -----
  const extraClientDefs: ClientSeed[] = [
    {
      email: "alex@demo.com",
      firstName: "Alex",
      lastName: "Chen",
      goals: "Career transition and leadership development. StrengthsFinder integration and executive presence.",
      tenure: "6months",
    },
    {
      email: "jordan@demo.com",
      firstName: "Jordan",
      lastName: "Smith",
      goals: "Work-life balance and boundary setting. Time management and delegation.",
      tenure: "4months",
    },
    {
      email: "riley@demo.com",
      firstName: "Riley",
      lastName: "Davis",
      goals: "Executive presence and board-level communication. Preparing for C-suite transition.",
      tenure: "6months",
    },
    {
      email: "sam@demo.com",
      firstName: "Sam",
      lastName: "Taylor",
      goals: "StrengthsFinder integration and team leadership. Building high-performing teams.",
      tenure: "2months",
    },
    {
      email: "morgan@demo.com",
      firstName: "Morgan",
      lastName: "Lee",
      goals: "Confidence and assertiveness. Navigating difficult conversations.",
      tenure: "1month",
    },
    {
      email: "casey@demo.com",
      firstName: "Casey",
      lastName: "Brown",
      goals: "First-time people leader. Transitioning from IC to manager.",
      tenure: "new",
    },
  ];

  const extraClients: { user: { id: string }; profile: ClientProfile }[] = [];
  for (const def of extraClientDefs) {
    const c = await ensureClient(hashedPassword, coach.id, def);
    extraClients.push(c);
    console.log("✓ Client:", def.firstName, def.lastName, `(${def.email})`);
  }

  // ----- 1 new pending intake form -----
  const existingIntakes = await storage.getAllIntakeForms();
  if (existingIntakes.length < 2) {
    await storage.createIntakeForm({
      firstName: "Jamie",
      lastName: "Rivera",
      email: "jamie.rivera@example.com",
      phone: "+1 (555) 987-6543",
      goals: "I'm exploring executive coaching to prepare for a C-suite role in the next 18 months. I want to work on strategic vision, board communication, and leading through change.",
      experience: "10+ years in operations and strategy. Led two major M&A integrations.",
      availability: "Tuesday and Thursday afternoons, or Wednesday mornings.",
      howDidYouHear: "LinkedIn",
      location: "San Francisco, CA",
      preferredMeetingFormat: "video_zoom",
      status: "pending",
    });
    console.log("✓ Pending intake: Jamie Rivera (jamie.rivera@example.com)");
  }

  // ----- Coach settings -----
  let coachSettings = await storage.getCoachSettings(coach.id);
  if (!coachSettings) {
    coachSettings = await storage.createOrUpdateCoachSettings(coach.id, {
      hourlyRate: 175,
      sessionDuration: 60,
      packageDiscount: 15,
    });
    console.log("✓ Created coach settings");
  }

  // ----- Multiple Sessions -----
  const existingSessions = await storage.getSessionsByClient(clientProfile.id);
  
  if (existingSessions.length < 5) {
    // Clear existing sessions for fresh data
    console.log("Creating comprehensive session history...");

    // Session 1: Completed session from 3 weeks ago
    const session1 = await storage.createSession({
      clientId: clientProfile.id,
      title: "Discovery Session",
      description: "Initial coaching session to understand goals, challenges, and establish coaching agreement.",
      scheduledAt: subWeeks(new Date(), 3),
      duration: 90,
      status: "completed",
      requestedBy: "coach",
      meetingLink: "https://meet.google.com/abc-defg-hij",
      prepNotes: "Review intake form responses. Prepare discovery questions.",
      sessionNotes: "Great initial session. Client is motivated and has clear vision. Key focus areas identified: leadership presence, delegation skills, and strategic thinking.",
      notesVisibleToClient: true,
      clientReflection: "Really insightful session! I feel much clearer about what I want to work on. The exercise around values was particularly helpful.",
    });
    console.log("  ✓ Session 1: Discovery Session (completed)");

    // Session 2: Completed session from 2 weeks ago
    const session2 = await storage.createSession({
      clientId: clientProfile.id,
      title: "Leadership Presence Workshop",
      description: "Deep dive into leadership presence and executive communication.",
      scheduledAt: subWeeks(new Date(), 2),
      duration: 60,
      status: "completed",
      requestedBy: "client",
      meetingLink: "https://meet.google.com/abc-defg-hij",
      prepNotes: "Prepare leadership presence framework. Review 360 feedback.",
      sessionNotes: "Explored leadership presence model. Client practiced elevator pitch and received feedback. Assigned stakeholder mapping exercise.",
      notesVisibleToClient: true,
      clientReflection: "The practice exercises were challenging but valuable. I need to work on my opening presence in meetings.",
    });
    console.log("  ✓ Session 2: Leadership Presence (completed)");

    // Session 3: Completed session from 1 week ago
    const session3 = await storage.createSession({
      clientId: clientProfile.id,
      title: "Delegation & Empowerment",
      description: "Building effective delegation skills and empowering team members.",
      scheduledAt: subWeeks(new Date(), 1),
      duration: 60,
      status: "completed",
      requestedBy: "coach",
      meetingLink: "https://meet.google.com/abc-defg-hij",
      prepNotes: "Review delegation matrix template. Prepare case studies.",
      sessionNotes: "Reviewed current delegation patterns. Identified tasks for delegation. Created action plan for empowering two direct reports.",
      notesVisibleToClient: true,
    });
    console.log("  ✓ Session 3: Delegation (completed)");

    // Session 4: Upcoming session tomorrow
    const tomorrow = addDays(new Date(), 1);
    tomorrow.setHours(14, 0, 0, 0);
    const session4 = await storage.createSession({
      clientId: clientProfile.id,
      title: "Strategic Thinking Deep Dive",
      description: "Developing strategic thinking capabilities and long-term planning skills.",
      scheduledAt: tomorrow,
      duration: 60,
      status: "scheduled",
      requestedBy: "coach",
      meetingLink: "https://meet.google.com/abc-defg-hij",
      prepNotes: "Prepare strategic frameworks. Review client's current projects for strategic opportunities.",
      notesVisibleToClient: false,
    });
    console.log("  ✓ Session 4: Strategic Thinking (tomorrow)");

    // Session 5: Upcoming session next week
    const nextWeek = addDays(new Date(), 8);
    nextWeek.setHours(10, 30, 0, 0);
    const session5 = await storage.createSession({
      clientId: clientProfile.id,
      title: "Mid-Program Review",
      description: "Review progress, celebrate wins, and adjust goals as needed.",
      scheduledAt: nextWeek,
      duration: 60,
      status: "scheduled",
      requestedBy: "client",
      meetingLink: "https://meet.google.com/abc-defg-hij",
      notesVisibleToClient: false,
    });
    console.log("  ✓ Session 5: Mid-Program Review (next week)");

    // Session 6: Cancelled session (for variety)
    const session6 = await storage.createSession({
      clientId: clientProfile.id,
      title: "Conflict Resolution Skills",
      description: "Addressing workplace conflicts constructively.",
      scheduledAt: subDays(new Date(), 5),
      duration: 60,
      status: "cancelled",
      requestedBy: "client",
      notesVisibleToClient: false,
    });
    console.log("  ✓ Session 6: Conflict Resolution (cancelled)");

    // ----- Sessions across the other 7 clients (~6 months of operation) -----
    // 6-month clients: ~11 sessions; 4-month: ~8; 3-month: ~5; 2-month: ~4; 1-month: ~2; new: ~1
    const allOtherProfiles = [
      { profile: devProfile, userId: devUser!.id, name: "Nathaniel", sessionsCount: 4 },
      { profile: extraClients[0].profile, userId: (await authStorage.getUserByEmail("alex@demo.com"))!.id, name: "Alex Chen", sessionsCount: 11 },
      { profile: extraClients[1].profile, userId: (await authStorage.getUserByEmail("jordan@demo.com"))!.id, name: "Jordan Smith", sessionsCount: 8 },
      { profile: extraClients[2].profile, userId: (await authStorage.getUserByEmail("riley@demo.com"))!.id, name: "Riley Davis", sessionsCount: 11 },
      { profile: extraClients[3].profile, userId: (await authStorage.getUserByEmail("sam@demo.com"))!.id, name: "Sam Taylor", sessionsCount: 4 },
      { profile: extraClients[4].profile, userId: (await authStorage.getUserByEmail("morgan@demo.com"))!.id, name: "Morgan Lee", sessionsCount: 2 },
      { profile: extraClients[5].profile, userId: (await authStorage.getUserByEmail("casey@demo.com"))!.id, name: "Casey Brown", sessionsCount: 1 },
    ];

    const sessionTitles = [
      "Discovery & Goals",
      "Values & Priorities",
      "Progress Review",
      "Skill Deep Dive",
      "Action Planning",
      "Mid-Program Check-in",
      "Accountability Session",
      "Next Steps",
      "Wrap-up",
    ];

    let sessionCount = 6;
    for (const { profile: prof, userId: uid, name, sessionsCount: n } of allOtherProfiles) {
      // Spread past sessions over ~6 months (26w), 4 months (18w), 2 months (12w), 1 month (6w), or new (2w)
      const baseWeeksAgo = n >= 10 ? 26 : n >= 6 ? 18 : n >= 4 ? 12 : n >= 2 ? 6 : 2;
      for (let i = 0; i < n; i++) {
        const weeksAgo = baseWeeksAgo - i * (baseWeeksAgo / Math.max(1, n - 1));
        const isPast = i < n - 1 || (n === 1 && i === 0);
        const isUpcoming = !isPast && i === n - 1;
        const scheduledAt = isUpcoming
          ? addDays(new Date(), 7 + i * 7)
          : subWeeks(new Date(), Math.max(1, Math.floor(weeksAgo)));
        const status = isUpcoming ? "scheduled" : isPast ? (i === 0 && n > 1 ? "cancelled" : "completed") : "scheduled";
        const title = sessionTitles[Math.min(i, sessionTitles.length - 1)] + (n > 1 ? ` (${name})` : "");
        await storage.createSession({
          clientId: prof.id,
          title: i === 0 ? `Discovery Session – ${name}` : title,
          description: "Coaching session.",
          scheduledAt,
          duration: 60,
          status,
          requestedBy: i % 2 === 0 ? "coach" : "client",
          meetingLink: status === "scheduled" ? "https://meet.google.com/abc-defg-hij" : undefined,
          sessionNotes: status === "completed" ? `Solid session with ${name}.` : undefined,
          notesVisibleToClient: status === "completed",
        });
        sessionCount++;
      }
      console.log(`  ✓ ${n} sessions for ${name} (total: ${sessionCount})`);
    }

    // ----- Action Items with various statuses -----
    console.log("\nCreating action items...");

    // Completed actions
    await storage.createActionItem({
      clientId: clientProfile.id,
      sessionId: session1.id,
      title: "Complete values clarification exercise",
      description: "Use the provided worksheet to identify your top 5 core values and how they show up in your work.",
      dueDate: subWeeks(new Date(), 2),
      status: "completed",
      createdBy: coach.id,
    });
    console.log("  ✓ Action: Values exercise (completed)");

    await storage.createActionItem({
      clientId: clientProfile.id,
      sessionId: session2.id,
      title: "Practice 60-second leadership introduction",
      description: "Record yourself giving your leadership introduction 3 times and note improvements.",
      dueDate: subWeeks(new Date(), 1),
      status: "completed",
      createdBy: coach.id,
    });
    console.log("  ✓ Action: Leadership intro practice (completed)");

    await storage.createActionItem({
      clientId: clientProfile.id,
      sessionId: session2.id,
      title: "Complete stakeholder mapping",
      description: "Map your key stakeholders using the influence/interest matrix.",
      dueDate: subDays(new Date(), 10),
      status: "completed",
      createdBy: coach.id,
    });
    console.log("  ✓ Action: Stakeholder mapping (completed)");

    // In-progress actions
    await storage.createActionItem({
      clientId: clientProfile.id,
      sessionId: session3.id,
      title: "Delegate one project to team member",
      description: "Choose one project from your list and use the RACI model to delegate it effectively.",
      dueDate: addDays(new Date(), 3),
      status: "in_progress",
      createdBy: coach.id,
    });
    console.log("  ✓ Action: Delegate project (in progress)");

    await storage.createActionItem({
      clientId: clientProfile.id,
      sessionId: session3.id,
      title: "Schedule empowerment conversation",
      description: "Have an empowerment conversation with your direct report using the framework we discussed.",
      dueDate: addDays(new Date(), 5),
      status: "in_progress",
      createdBy: coach.id,
    });
    console.log("  ✓ Action: Empowerment conversation (in progress)");

    // Pending actions
    await storage.createActionItem({
      clientId: clientProfile.id,
      sessionId: session4.id,
      title: "Read strategic thinking article",
      description: "Read the Harvard Business Review article on strategic thinking and note 3 key takeaways.",
      dueDate: addDays(new Date(), 7),
      status: "pending",
      createdBy: coach.id,
    });
    console.log("  ✓ Action: Read HBR article (pending)");

    await storage.createActionItem({
      clientId: clientProfile.id,
      title: "Journal daily wins for one week",
      description: "Each evening, write down 3 wins from the day, no matter how small.",
      dueDate: addDays(new Date(), 14),
      status: "pending",
      createdBy: coach.id,
    });
    console.log("  ✓ Action: Daily journaling (pending)");

    // ----- Resources -----
    console.log("\nCreating resources...");

    await storage.createResource({
      title: "Leadership Presence Framework",
      description: "A comprehensive guide to developing executive presence and commanding attention in any room.",
      fileType: "pdf",
      fileName: "leadership-presence-guide.pdf",
      clientId: clientProfile.id,
      sessionId: session2.id,
      isGlobal: false,
      uploadedBy: coach.id,
    });
    console.log("  ✓ Resource: Leadership Presence Framework");

    await storage.createResource({
      title: "Delegation Matrix Template",
      description: "Excel template for categorizing tasks and identifying delegation opportunities.",
      fileType: "spreadsheet",
      fileName: "delegation-matrix.xlsx",
      clientId: clientProfile.id,
      sessionId: session3.id,
      isGlobal: false,
      uploadedBy: coach.id,
    });
    console.log("  ✓ Resource: Delegation Matrix");

    await storage.createResource({
      title: "Strategic Thinking Workbook",
      description: "Interactive workbook with exercises for developing strategic thinking capabilities.",
      fileType: "pdf",
      fileName: "strategic-thinking-workbook.pdf",
      clientId: clientProfile.id,
      isGlobal: false,
      uploadedBy: coach.id,
    });
    console.log("  ✓ Resource: Strategic Thinking Workbook");

    await storage.createResource({
      title: "Values Clarification Exercise",
      description: "Worksheet to help identify and prioritize your core values.",
      fileType: "pdf",
      fileName: "values-exercise.pdf",
      isGlobal: true,
      uploadedBy: coach.id,
    });
    console.log("  ✓ Resource: Values Exercise (global)");

    // ----- Session Messages -----
    console.log("\nCreating session messages...");

    await storage.createMessage({
      sessionId: session4.id,
      senderId: coach.id,
      content: "Looking forward to our session tomorrow! Please review the strategic thinking frameworks I sent earlier.",
    });
    await storage.createMessage({
      sessionId: session4.id,
      senderId: client.id,
      content: "Thanks! I've reviewed them and have some questions about applying the SWOT analysis to my department.",
    });
    await storage.createMessage({
      sessionId: session4.id,
      senderId: coach.id,
      content: "Great question - we'll definitely cover that. Come prepared with a current challenge you'd like to analyze strategically.",
    });
    console.log("  ✓ Session messages created");

    // ----- Payments & Invoices -----
    console.log("\nCreating payment history...");

    // Invoice 1: Paid
    const [invoice1] = await db.insert(invoices).values({
      invoiceNumber: "INV-00001",
      clientId: clientProfile.id,
      amount: 52500, // $525.00
      currency: "usd",
      status: "paid",
      dueDate: subWeeks(new Date(), 4),
      paidAt: subWeeks(new Date(), 4),
      items: JSON.stringify([
        { description: "Executive Coaching Package - 3 Sessions", amount: 52500 }
      ]),
      notes: "Initial coaching package",
    }).returning();
    console.log("  ✓ Invoice 1: $525.00 (paid)");

    // Payment for Invoice 1
    await db.insert(payments).values({
      clientId: clientProfile.id,
      invoiceId: invoice1.id,
      amount: 52500,
      currency: "usd",
      status: "completed",
      provider: "stripe",
      providerPaymentId: "pi_demo_" + Math.random().toString(36).substring(7),
      description: "Executive Coaching Package - 3 Sessions",
      paidAt: subWeeks(new Date(), 4),
    });
    console.log("  ✓ Payment 1: $525.00 via Stripe");

    // Invoice 2: Paid
    const [invoice2] = await db.insert(invoices).values({
      invoiceNumber: "INV-00002",
      clientId: clientProfile.id,
      amount: 17500, // $175.00
      currency: "usd",
      status: "paid",
      dueDate: subWeeks(new Date(), 1),
      paidAt: subDays(new Date(), 5),
      items: JSON.stringify([
        { description: "Individual Coaching Session", amount: 17500 }
      ]),
    }).returning();
    console.log("  ✓ Invoice 2: $175.00 (paid)");

    // Payment for Invoice 2
    await db.insert(payments).values({
      clientId: clientProfile.id,
      invoiceId: invoice2.id,
      amount: 17500,
      currency: "usd",
      status: "completed",
      provider: "paypal",
      providerPaymentId: "PAY-demo-" + Math.random().toString(36).substring(7),
      description: "Individual Coaching Session",
      paidAt: subDays(new Date(), 5),
    });
    console.log("  ✓ Payment 2: $175.00 via PayPal");

    // Invoice 3: Pending
    await db.insert(invoices).values({
      invoiceNumber: "INV-00003",
      clientId: clientProfile.id,
      amount: 35000, // $350.00
      currency: "usd",
      status: "sent",
      dueDate: addDays(new Date(), 14),
      items: JSON.stringify([
        { description: "Coaching Sessions - 2 Sessions", amount: 35000 }
      ]),
      notes: "Payment due within 14 days",
    });
    console.log("  ✓ Invoice 3: $350.00 (pending)");
  } else {
    console.log("Sessions already exist, skipping comprehensive data creation");
  }

  // ----- Notifications -----
  console.log("\nCreating notifications...");
  
  const coachNotifications = await storage.getNotificationsByUser(coach.id);
  if (coachNotifications.length < 3) {
    await storage.createNotification({
      userId: coach.id,
      type: "session_scheduled",
      title: "Session Tomorrow",
      message: "You have a session with Demo Client tomorrow at 2:00 PM.",
    });
    await storage.createNotification({
      userId: coach.id,
      type: "payment_received",
      title: "Payment Received",
      message: "Demo Client paid $175.00 for Individual Coaching Session.",
    });
    await storage.createNotification({
      userId: coach.id,
      type: "intake_submitted",
      title: "New Inquiry",
      message: "A new potential client has submitted an intake form.",
    });
    console.log("  ✓ Coach notifications created");
  }

  const clientNotifications = await storage.getNotificationsByUser(client.id);
  if (clientNotifications.length < 3) {
    await storage.createNotification({
      userId: client.id,
      type: "session_scheduled",
      title: "Session Tomorrow",
      message: "Your coaching session is tomorrow at 2:00 PM. Don't forget to prepare!",
    });
    await storage.createNotification({
      userId: client.id,
      type: "action_assigned",
      title: "New Action Item",
      message: "You have a new action item: Read strategic thinking article.",
    });
    await storage.createNotification({
      userId: client.id,
      type: "resource_uploaded",
      title: "New Resource Available",
      message: "Your coach shared a new resource: Strategic Thinking Workbook.",
    });
    console.log("  ✓ Client notifications created");
  }

  console.log("\n" + "=".repeat(50));
  console.log("✓ DEMO ACCOUNTS READY");
  console.log("=".repeat(50));
  console.log("\nCredentials (password for both): demo123");
  console.log("┌─────────┬─────────────────────┬──────────────────┐");
  console.log("│ Role    │ Email               │ Dashboard        │");
  console.log("├─────────┼─────────────────────┼──────────────────┤");
  console.log("│ Coach   │ coach@example.com   │ /coach           │");
  console.log("│ Client  │ client@example.com  │ /client          │");
  console.log("└─────────┴─────────────────────┴──────────────────┘");
  console.log("\nDemo data includes:");
  console.log("  • 8 clients (varied tenure: 6 months to new), 1 pending intake");
  console.log("  • Sessions across all clients (~6 months of operation)");
  console.log("  • Action items, resources, session messages");
  console.log("  • 3 invoices ($525 + $175 paid, $350 pending), 2 payments");
  console.log("  • Notifications for coach and clients");
  console.log("");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
