import { useQuery } from "@tanstack/react-query";
import { format, isPast, isFuture, isToday } from "date-fns";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { DashboardSkeleton } from "@/components/loading-skeleton";
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
      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName || "there"}
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your coaching journey.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Sessions"
          value={sessions?.length || 0}
          description="All time"
          icon={Calendar}
        />
        <StatCard
          title="Completed Sessions"
          value={completedSessions.length}
          icon={CheckCircle2}
        />
        <StatCard
          title="Pending Actions"
          value={pendingActions.length}
          description={`${completedActions.length} completed`}
          icon={Target}
        />
        <StatCard
          title="Next Session"
          value={nextSession ? format(new Date(nextSession.scheduledAt), "MMM d") : "None"}
          description={nextSession ? format(new Date(nextSession.scheduledAt), "h:mm a") : "Schedule one!"}
          icon={Clock}
        />
        <StatCard
          title="Engagement Score"
          value={progressMetrics?.engagementScore || 0}
          description="Your coaching engagement"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Next Session Card */}
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
                  <Badge variant={isToday(new Date(nextSession.scheduledAt)) ? "default" : "secondary"}>
                    {isToday(new Date(nextSession.scheduledAt)) ? "Today" : format(new Date(nextSession.scheduledAt), "MMM d")}
                  </Badge>
                </div>
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

        {/* Action Items Card */}
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{actionProgress}%</span>
                  </div>
                  <Progress value={actionProgress} className="h-2" />
                </div>
                <div className="space-y-2">
                  {pendingActions.slice(0, 3).map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                    >
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
                  ))}
                </div>
                {pendingActions.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{pendingActions.length - 3} more actions
                  </p>
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
      </div>

      {/* Recent Sessions */}
      {completedSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Sessions</CardTitle>
            <CardDescription>Your completed coaching sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedSessions.slice(0, 3).map((session) => (
                <Link key={session.id} href={`/client/sessions/${session.id}`}>
                  <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover-elevate cursor-pointer">
                    <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{session.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.scheduledAt), "MMMM d, yyyy")}
                      </p>
                    </div>
                    {session.sessionNotes && session.notesVisibleToClient && (
                      <Badge variant="outline">
                        <FileText className="mr-1 h-3 w-3" />
                        Notes
                      </Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
