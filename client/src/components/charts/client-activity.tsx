"use client";

import { useMemo } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, format } from "date-fns";
import type { Session, ClientProfile } from "@shared/schema";

interface ClientWithUser extends ClientProfile {
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
}

interface ClientActivityProps {
  clients: ClientWithUser[];
  sessions: Session[];
  maxClients?: number;
}

interface ClientActivityData {
  client: ClientWithUser;
  lastSession: Date | null;
  sessionCount: number;
  daysSinceLastSession: number;
  activityLevel: "active" | "moderate" | "needs-attention";
}

export function ClientActivity({ clients, sessions, maxClients = 5 }: ClientActivityProps) {
  const clientActivityData = useMemo(() => {
    const data: ClientActivityData[] = clients.map(client => {
      const clientSessions = sessions.filter(s => s.clientId === client.id);
      const completedSessions = clientSessions.filter(s => s.status === "completed");
      
      const lastSession = completedSessions.length > 0
        ? new Date(Math.max(...completedSessions.map(s => new Date(s.scheduledAt).getTime())))
        : null;
      
      const daysSince = lastSession ? differenceInDays(new Date(), lastSession) : 999;
      
      let activityLevel: "active" | "moderate" | "needs-attention" = "active";
      if (daysSince > 30) activityLevel = "needs-attention";
      else if (daysSince > 14) activityLevel = "moderate";
      
      return {
        client,
        lastSession,
        sessionCount: completedSessions.length,
        daysSinceLastSession: daysSince,
        activityLevel,
      };
    });
    
    // Sort by days since last session (needs attention first)
    return data.sort((a, b) => b.daysSinceLastSession - a.daysSinceLastSession);
  }, [clients, sessions]);

  const getClientName = (client: ClientWithUser) => {
    const user = client.user;
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user?.email || `Client #${client.id.slice(0, 8)}`;
  };

  const getActivityColor = (level: string) => {
    switch (level) {
      case "active":
        return "bg-green-500";
      case "moderate":
        return "bg-amber-500";
      case "needs-attention":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getActivityBadge = (level: string) => {
    switch (level) {
      case "active":
        return <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">Active</Badge>;
      case "moderate":
        return <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">Moderate</Badge>;
      case "needs-attention":
        return <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">Needs Attention</Badge>;
      default:
        return null;
    }
  };

  if (clientActivityData.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No client activity data yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {clientActivityData.slice(0, maxClients).map(({ client, lastSession, sessionCount, activityLevel }, index) => (
        <Link key={client.id} href={`/coach/clients/${client.id}`}>
          <div 
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
            style={{ 
              animationDelay: `${index * 50}ms`,
              animation: 'fadeSlideIn 0.3s ease-out forwards',
              opacity: 0,
            }}
          >
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                {getClientName(client).charAt(0).toUpperCase()}
              </div>
              <div 
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${getActivityColor(activityLevel)}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate group-hover:text-primary transition-colors">
                {getClientName(client)}
              </p>
              <p className="text-xs text-muted-foreground">
                {lastSession 
                  ? `Last session: ${format(lastSession, "MMM d")}`
                  : "No sessions yet"
                }
                {sessionCount > 0 && ` · ${sessionCount} total`}
              </p>
            </div>
            {getActivityBadge(activityLevel)}
          </div>
        </Link>
      ))}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
