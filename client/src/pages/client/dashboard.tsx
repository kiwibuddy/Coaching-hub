import { useQuery } from "@tanstack/react-query";
import { format, isPast, isFuture, isToday } from "date-fns";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import { ProgressRing, SessionTimeline } from "@/components/charts";
import { AnimatedCard } from "@/components/animated-card";
import { SessionCountdown } from "@/components/session-countdown";
import { useAuth } from "@/hooks/use-auth";
import type { Session, ActionItem } from "@shared/schema";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Target,
  ArrowRight,
  CalendarDays,
  ListTodo,
  TrendingUp,
  Award,
  History,
} from "lucide-react";

interface ClientProgressMetrics {
  sessionsAttended: number;
  totalSessions: number;
  upcomingSessions: number;
  actionItemsCompleted: number;
  actionItemsTotal: number;
  actionItemCompletionRate: number;
  engagementScore: number;
  reflectionsSubmitted: number;
}

export default function ClientDashboard() {
  const { user } = useAuth();

  const { data: sessions, isLoading: sessionsLoading } = useQuery<Session[]>({
    queryKey: ["/api/client/sessions"],
  });

  const { data: actionItems, isLoading: actionsLoading } = useQuery<ActionItem[]>({
    queryKey: ["/api/client/actions"],
  });

  const { data: progressMetrics } = useQuery<ClientProgressMetrics>({
    queryKey: ["/api/client/analytics"],
  });

  const isLoading = sessionsLoading || actionsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const upcomingSessions = sessions?.filter(s => s.status === "scheduled" && isFuture(new Date(s.scheduledAt))) || [];
  const completedSessions = sessions?.filter(s => s.status === "completed") || [];
  const pendingActions = actionItems?.filter(a => a.status !== "completed") || [];
  const completedActions = actionItems?.filter(a => a.status === "completed") || [];
  
  const nextSession = upcomingSessions.sort((a, b) => 
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  )[0];

  const actionProgress = actionItems?.length 
    ? Math.round((completedActions.length / actionItems.length) * 100) 
    : 0;

  return (
    <div className="space-y-8 p-6">
      {/* Welcome Section */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Welcome back, <span className="gradient-text">{user?.firstName || "there"}</span>
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your coaching journey.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Sessions"
          value={sessions?.length || 0}
          description="All time"
          icon={Calendar}
          href="/client/sessions"
          index={0}
        />
        <StatCard
          title="Completed Sessions"
          value={completedSessions.length}
          icon={CheckCircle2}
          href="/client/sessions"
          index={1}
        />
        <StatCard
          title="Pending Actions"
          value={pendingActions.length}
          description={`${completedActions.length} completed`}
          icon={Target}
          href="/client/actions"
          index={2}
        />
        <StatCard
          title="Next Session"
          value={nextSession ? format(new Date(nextSession.scheduledAt), "MMM d") : "None"}
          description={nextSession ? format(new Date(nextSession.scheduledAt), "h:mm a") : "Schedule one!"}
          icon={Clock}
          href={nextSession ? `/client/sessions/${nextSession.id}` : "/client/sessions"}
          index={3}
        />
        <StatCard
          title="Engagement Score"
          value={progressMetrics?.engagementScore || 0}
          description="Your coaching engagement"
          icon={TrendingUp}
          index={4}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Next Session Card */}
        <AnimatedCard delay={0.5}>
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-lg">Upcoming Session</CardTitle>
              <CardDescription>Your next scheduled coaching session</CardDescription>
            </div>
            <Link href="/client/sessions">
              <Button variant="ghost" size="sm" data-testid="button-view-sessions">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {nextSession ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="rounded-full bg-primary/10 p-3">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{nextSession.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(nextSession.scheduledAt), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(nextSession.scheduledAt), "h:mm a")} · {nextSession.duration} minutes
                    </p>
                  </div>
                  <SessionCountdown 
                    scheduledAt={nextSession.scheduledAt}
                    meetingLink={nextSession.meetingLink}
                    variant="badge"
                    size="default"
                  />
                </div>
                {/* Join Now Card when session is imminent */}
                <SessionCountdown 
                  scheduledAt={nextSession.scheduledAt}
                  meetingLink={nextSession.meetingLink}
                  variant="card"
                  showWithinHours={1}
                />
                {nextSession.prepNotes && (
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-sm font-medium mb-2">Pre-session notes</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">{nextSession.prepNotes}</p>
                  </div>
                )}
                <Link href={`/client/sessions/${nextSession.id}`}>
                  <Button className="w-full" data-testid="button-view-session">
                    View Session Details
                  </Button>
                </Link>
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No upcoming sessions"
                description="You don't have any sessions scheduled yet."
              />
            )}
          </CardContent>
        </Card>
        </AnimatedCard>

        {/* Action Items Card */}
        <AnimatedCard delay={0.6}>
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-lg">Action Items</CardTitle>
              <CardDescription>Track your progress on assigned tasks</CardDescription>
            </div>
            <Link href="/client/actions">
              <Button variant="ghost" size="sm" data-testid="button-view-actions">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {actionItems && actionItems.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <ProgressRing 
                    progress={actionProgress} 
                    size={100} 
                    strokeWidth={8}
                    label="Complete"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-medium">{completedActions.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="font-medium">{pendingActions.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium">{actionItems.length}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {pendingActions.slice(0, 3).map((action) => (
                    <Link key={action.id} href="/client/actions">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate cursor-pointer">
                        <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
                          <ListTodo className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{action.title}</p>
                          {action.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              Due {format(new Date(action.dueDate), "MMM d")}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {action.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
                {pendingActions.length > 3 && (
                  <Link href="/client/actions">
                    <p className="text-sm text-primary hover:underline text-center cursor-pointer">
                      View {pendingActions.length - 3} more actions →
                    </p>
                  </Link>
                )}
              </div>
            ) : (
              <EmptyState
                icon={Target}
                title="No action items"
                description="Your action items will appear here."
              />
            )}
          </CardContent>
        </Card>
        </AnimatedCard>
      </div>

      {/* Coaching Journey Timeline */}
      {sessions && sessions.length > 0 && (
        <AnimatedCard delay={0.7}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Your Coaching Journey
                </CardTitle>
                <CardDescription>Timeline of your sessions</CardDescription>
              </div>
              <Link href="/client/sessions">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <SessionTimeline 
                sessions={sessions} 
                maxItems={5} 
              basePath="/client/sessions"
            />
          </CardContent>
          </Card>
        </AnimatedCard>
      )}
    </div>
  );
}
