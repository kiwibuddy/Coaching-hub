import { db } from "../db";
import { 
  coachingSessions, 
  clientProfiles, 
  actionItems, 
  payments,
  users 
} from "@shared/schema";
import { eq, gte, lte, and, count, sum, sql } from "drizzle-orm";
import { subDays, startOfMonth, endOfMonth, format, subMonths } from "date-fns";

// ============================================================
// COACH ANALYTICS
// ============================================================

export interface CoachOverviewMetrics {
  totalClients: number;
  activeClients: number;
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  sessionCompletionRate: number;
  totalRevenue: number;
  pendingPayments: number;
  actionItemCompletionRate: number;
}

export async function getCoachOverviewMetrics(): Promise<CoachOverviewMetrics> {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  // Get client counts
  const [clientCount] = await db.select({ count: count() }).from(clientProfiles);
  const totalClients = clientCount?.count || 0;

  // Active clients (with session in last 30 days)
  const activeClientResult = await db.selectDistinct({ clientId: coachingSessions.clientId })
    .from(coachingSessions)
    .where(gte(coachingSessions.scheduledAt, thirtyDaysAgo));
  const activeClients = activeClientResult.length;

  // Session counts
  const [sessionCounts] = await db.select({
    total: count(),
  }).from(coachingSessions);
  const totalSessions = sessionCounts?.total || 0;

  const [completedCount] = await db.select({ count: count() })
    .from(coachingSessions)
    .where(eq(coachingSessions.status, "completed"));
  const completedSessions = completedCount?.count || 0;

  const [upcomingCount] = await db.select({ count: count() })
    .from(coachingSessions)
    .where(and(
      eq(coachingSessions.status, "scheduled"),
      gte(coachingSessions.scheduledAt, now)
    ));
  const upcomingSessions = upcomingCount?.count || 0;

  // Completion rate
  const sessionCompletionRate = totalSessions > 0 
    ? Math.round((completedSessions / totalSessions) * 100) 
    : 0;

  // Revenue
  const [revenueResult] = await db.select({
    total: sum(payments.amount),
  })
    .from(payments)
    .where(eq(payments.status, "completed"));
  const totalRevenue = Number(revenueResult?.total || 0);

  const [pendingResult] = await db.select({
    total: sum(payments.amount),
  })
    .from(payments)
    .where(eq(payments.status, "pending"));
  const pendingPayments = Number(pendingResult?.total || 0);

  // Action items completion rate
  const [totalActions] = await db.select({ count: count() }).from(actionItems);
  const [completedActions] = await db.select({ count: count() })
    .from(actionItems)
    .where(eq(actionItems.status, "completed"));
  const actionItemCompletionRate = (totalActions?.count || 0) > 0
    ? Math.round((completedActions?.count || 0) / (totalActions?.count || 1) * 100)
    : 0;

  return {
    totalClients,
    activeClients,
    totalSessions,
    completedSessions,
    upcomingSessions,
    sessionCompletionRate,
    totalRevenue,
    pendingPayments,
    actionItemCompletionRate,
  };
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export async function getMonthlyRevenue(months: number = 6): Promise<MonthlyRevenue[]> {
  const results: MonthlyRevenue[] = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    
    const [result] = await db.select({
      total: sum(payments.amount),
    })
      .from(payments)
      .where(and(
        eq(payments.status, "completed"),
        gte(payments.paidAt, start),
        lte(payments.paidAt, end)
      ));
    
    results.push({
      month: format(monthDate, "MMM yyyy"),
      revenue: Number(result?.total || 0),
    });
  }
  
  return results;
}

export interface SessionsTrend {
  week: string;
  completed: number;
  cancelled: number;
  scheduled: number;
}

export async function getSessionsTrend(weeks: number = 8): Promise<SessionsTrend[]> {
  const results: SessionsTrend[] = [];
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = subDays(new Date(), (i + 1) * 7);
    const weekEnd = subDays(new Date(), i * 7);
    
    const [completed] = await db.select({ count: count() })
      .from(coachingSessions)
      .where(and(
        eq(coachingSessions.status, "completed"),
        gte(coachingSessions.scheduledAt, weekStart),
        lte(coachingSessions.scheduledAt, weekEnd)
      ));
    
    const [cancelled] = await db.select({ count: count() })
      .from(coachingSessions)
      .where(and(
        eq(coachingSessions.status, "cancelled"),
        gte(coachingSessions.scheduledAt, weekStart),
        lte(coachingSessions.scheduledAt, weekEnd)
      ));
    
    const [scheduled] = await db.select({ count: count() })
      .from(coachingSessions)
      .where(and(
        eq(coachingSessions.status, "scheduled"),
        gte(coachingSessions.scheduledAt, weekStart),
        lte(coachingSessions.scheduledAt, weekEnd)
      ));
    
    results.push({
      week: format(weekStart, "MMM d"),
      completed: completed?.count || 0,
      cancelled: cancelled?.count || 0,
      scheduled: scheduled?.count || 0,
    });
  }
  
  return results;
}

// ============================================================
// CLIENT ANALYTICS
// ============================================================

export interface ClientProgressMetrics {
  sessionsAttended: number;
  totalSessions: number;
  upcomingSessions: number;
  actionItemsCompleted: number;
  actionItemsTotal: number;
  actionItemCompletionRate: number;
  engagementScore: number;
  reflectionsSubmitted: number;
}

export async function getClientProgressMetrics(clientId: string): Promise<ClientProgressMetrics> {
  const now = new Date();

  // Session counts
  const [totalSessionsResult] = await db.select({ count: count() })
    .from(coachingSessions)
    .where(eq(coachingSessions.clientId, clientId));
  const totalSessions = totalSessionsResult?.count || 0;

  const [attendedResult] = await db.select({ count: count() })
    .from(coachingSessions)
    .where(and(
      eq(coachingSessions.clientId, clientId),
      eq(coachingSessions.status, "completed")
    ));
  const sessionsAttended = attendedResult?.count || 0;

  const [upcomingResult] = await db.select({ count: count() })
    .from(coachingSessions)
    .where(and(
      eq(coachingSessions.clientId, clientId),
      eq(coachingSessions.status, "scheduled"),
      gte(coachingSessions.scheduledAt, now)
    ));
  const upcomingSessions = upcomingResult?.count || 0;

  // Action items
  const [totalActionsResult] = await db.select({ count: count() })
    .from(actionItems)
    .where(eq(actionItems.clientId, clientId));
  const actionItemsTotal = totalActionsResult?.count || 0;

  const [completedActionsResult] = await db.select({ count: count() })
    .from(actionItems)
    .where(and(
      eq(actionItems.clientId, clientId),
      eq(actionItems.status, "completed")
    ));
  const actionItemsCompleted = completedActionsResult?.count || 0;

  const actionItemCompletionRate = actionItemsTotal > 0
    ? Math.round((actionItemsCompleted / actionItemsTotal) * 100)
    : 0;

  // Reflections count (sessions with client reflection)
  const sessionsWithReflection = await db.select()
    .from(coachingSessions)
    .where(and(
      eq(coachingSessions.clientId, clientId),
      sql`${coachingSessions.clientReflection} IS NOT NULL AND ${coachingSessions.clientReflection} != ''`
    ));
  const reflectionsSubmitted = sessionsWithReflection.length;

  // Engagement score (simple formula: sessions + actions + reflections)
  const engagementScore = Math.min(100, Math.round(
    (sessionsAttended * 10) + (actionItemsCompleted * 5) + (reflectionsSubmitted * 5)
  ));

  return {
    sessionsAttended,
    totalSessions,
    upcomingSessions,
    actionItemsCompleted,
    actionItemsTotal,
    actionItemCompletionRate,
    engagementScore,
    reflectionsSubmitted,
  };
}

export interface ClientActivityTrend {
  month: string;
  sessions: number;
  actionsCompleted: number;
}

export async function getClientActivityTrend(clientId: string, months: number = 6): Promise<ClientActivityTrend[]> {
  const results: ClientActivityTrend[] = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    
    const [sessionsResult] = await db.select({ count: count() })
      .from(coachingSessions)
      .where(and(
        eq(coachingSessions.clientId, clientId),
        eq(coachingSessions.status, "completed"),
        gte(coachingSessions.scheduledAt, start),
        lte(coachingSessions.scheduledAt, end)
      ));
    
    const [actionsResult] = await db.select({ count: count() })
      .from(actionItems)
      .where(and(
        eq(actionItems.clientId, clientId),
        eq(actionItems.status, "completed"),
        gte(actionItems.completedAt, start),
        lte(actionItems.completedAt, end)
      ));
    
    results.push({
      month: format(monthDate, "MMM"),
      sessions: sessionsResult?.count || 0,
      actionsCompleted: actionsResult?.count || 0,
    });
  }
  
  return results;
}

// ============================================================
// PER-CLIENT ANALYTICS (for coach view)
// ============================================================

export interface ClientMetrics {
  clientId: string;
  sessionsCompleted: number;
  actionItemsCompleted: number;
  actionItemsTotal: number;
  lastSessionDate: Date | null;
  engagementScore: number;
}

export async function getClientMetrics(clientId: string): Promise<ClientMetrics> {
  const [completed] = await db.select({ count: count() })
    .from(coachingSessions)
    .where(and(
      eq(coachingSessions.clientId, clientId),
      eq(coachingSessions.status, "completed")
    ));
  
  const [totalActions] = await db.select({ count: count() })
    .from(actionItems)
    .where(eq(actionItems.clientId, clientId));
  
  const [completedActions] = await db.select({ count: count() })
    .from(actionItems)
    .where(and(
      eq(actionItems.clientId, clientId),
      eq(actionItems.status, "completed")
    ));
  
  const lastSession = await db.select()
    .from(coachingSessions)
    .where(and(
      eq(coachingSessions.clientId, clientId),
      eq(coachingSessions.status, "completed")
    ))
    .orderBy(sql`${coachingSessions.scheduledAt} DESC`)
    .limit(1);
  
  const sessionsCompleted = completed?.count || 0;
  const actionItemsCompleted = completedActions?.count || 0;
  const actionItemsTotal = totalActions?.count || 0;
  
  // Simple engagement score
  const actionRate = actionItemsTotal > 0 ? (actionItemsCompleted / actionItemsTotal) : 0;
  const engagementScore = Math.min(100, Math.round(
    (sessionsCompleted * 10) + (actionRate * 50)
  ));
  
  return {
    clientId,
    sessionsCompleted,
    actionItemsCompleted,
    actionItemsTotal,
    lastSessionDate: lastSession[0]?.scheduledAt || null,
    engagementScore,
  };
}
