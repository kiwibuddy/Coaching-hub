"use client";

import { useMemo } from "react";
import { Link } from "wouter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { subDays, startOfDay, isSameDay, format } from "date-fns";
import type { Session, ClientProfile, ActionItem } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ClientWithUser extends ClientProfile {
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
}

interface EngagementHeatmapProps {
  clients: ClientWithUser[];
  sessions: Session[];
  actionItems?: ActionItem[];
  days?: number;
  maxClients?: number;
}

interface ClientEngagement {
  client: ClientWithUser;
  dailyActivity: number[]; // Activity score for each day (0-3)
  totalScore: number;
  status: "active" | "moderate" | "needs-attention";
}

export function EngagementHeatmap({ 
  clients, 
  sessions, 
  actionItems = [],
  days = 7,
  maxClients = 5 
}: EngagementHeatmapProps) {
  
  // Get day labels for header
  const dayLabels = useMemo(() => {
    const labels = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      labels.push({
        short: format(date, "EEE").charAt(0),
        full: format(date, "EEE, MMM d"),
        date,
      });
    }
    return labels;
  }, [days]);

  const clientEngagement = useMemo(() => {
    const now = new Date();
    
    const data: ClientEngagement[] = clients.map(client => {
      const dailyActivity: number[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const targetDate = startOfDay(subDays(now, i));
        let dayScore = 0;
        
        // Check for sessions on this day
        const daySessions = sessions.filter(s => 
          s.clientId === client.id && 
          isSameDay(new Date(s.scheduledAt), targetDate)
        );
        dayScore += daySessions.filter(s => s.status === "completed").length * 3;
        dayScore += daySessions.filter(s => s.status === "scheduled").length * 1;
        
        // Check for action items completed on this day
        const dayActions = actionItems.filter(a => 
          a.clientId === client.id && 
          a.status === "completed" &&
          a.completedAt &&
          isSameDay(new Date(a.completedAt), targetDate)
        );
        dayScore += dayActions.length * 2;
        
        // Normalize to 0-3 scale
        dailyActivity.push(Math.min(3, dayScore));
      }
      
      const totalScore = dailyActivity.reduce((sum, v) => sum + v, 0);
      
      let status: "active" | "moderate" | "needs-attention" = "active";
      if (totalScore === 0) status = "needs-attention";
      else if (totalScore <= 3) status = "moderate";
      
      return {
        client,
        dailyActivity,
        totalScore,
        status,
      };
    });
    
    // Sort by status (needs attention first, then by total score)
    return data.sort((a, b) => {
      const statusOrder = { "needs-attention": 0, "moderate": 1, "active": 2 };
      if (a.status !== b.status) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.totalScore - a.totalScore;
    });
  }, [clients, sessions, actionItems, days]);

  const getClientName = (client: ClientWithUser) => {
    const user = client.user;
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user?.email || `Client #${client.id.slice(0, 8)}`;
  };

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0:
        return "bg-muted";
      case 1:
        return "bg-primary/30";
      case 2:
        return "bg-primary/60";
      case 3:
        return "bg-primary";
      default:
        return "bg-muted";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">
            Active
          </Badge>
        );
      case "moderate":
        return (
          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-xs">
            Moderate
          </Badge>
        );
      case "needs-attention":
        return (
          <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 text-xs">
            Needs Attention
          </Badge>
        );
      default:
        return null;
    }
  };

  if (clientEngagement.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No client engagement data yet
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header with day labels */}
        <div className="flex items-center gap-2">
          <div className="w-24 shrink-0" />
          <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))` }}>
            {dayLabels.map((day, i) => (
              <div key={i} className="text-center text-xs text-muted-foreground font-medium">
                {day.short}
              </div>
            ))}
          </div>
          <div className="w-20 shrink-0" />
        </div>

        {/* Client rows */}
        {clientEngagement.slice(0, maxClients).map(({ client, dailyActivity, status }, index) => (
          <Link key={client.id} href={`/coach/clients/${client.id}`}>
            <div 
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
              style={{ 
                animationDelay: `${index * 50}ms`,
                animation: "fadeIn 0.3s ease-out forwards",
                opacity: 0,
              }}
            >
              {/* Client name */}
              <div className="w-24 shrink-0 truncate">
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  {getClientName(client).split(" ")[0]}
                </span>
              </div>

              {/* Heat map cells */}
              <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))` }}>
                {dailyActivity.map((intensity, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "aspect-square rounded-sm transition-all",
                          getIntensityColor(intensity),
                          "hover:ring-2 hover:ring-primary/50"
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{dayLabels[i].full}</p>
                      <p className="text-xs text-muted-foreground">
                        {intensity === 0 ? "No activity" :
                         intensity === 1 ? "Low activity" :
                         intensity === 2 ? "Moderate activity" :
                         "High activity"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {/* Status badge */}
              <div className="w-20 shrink-0 flex justify-end">
                {getStatusBadge(status)}
              </div>
            </div>
          </Link>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t">
          <span className="text-xs text-muted-foreground">Activity:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <span className="text-xs text-muted-foreground">None</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-primary/30" />
            <span className="text-xs text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-primary/60" />
            <span className="text-xs text-muted-foreground">Med</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span className="text-xs text-muted-foreground">High</span>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </TooltipProvider>
  );
}
