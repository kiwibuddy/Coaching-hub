"use client";

import { Link } from "wouter";
import { format, isToday, isYesterday, isFuture } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Calendar, FileText } from "lucide-react";
import type { Session } from "@shared/schema";

interface SessionTimelineProps {
  sessions: Session[];
  maxItems?: number;
  showNotes?: boolean;
  basePath?: string;
}

export function SessionTimeline({ 
  sessions, 
  maxItems = 5, 
  showNotes = true,
  basePath = "/client/sessions"
}: SessionTimelineProps) {
  // Sort sessions by date, most recent first (filter out those without scheduledAt)
  const sortedSessions = [...sessions]
    .filter(s => s.scheduledAt)
    .sort((a, b) => new Date(b.scheduledAt!).getTime() - new Date(a.scheduledAt!).getTime())
    .slice(0, maxItems);

  const formatSessionDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d, yyyy");
  };

  const getStatusIcon = (status: string | null, scheduledAt: Date) => {
    if (status === "completed") {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (isFuture(scheduledAt)) {
      return <Clock className="h-4 w-4 text-blue-500" />;
    }
    return <Calendar className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusColor = (status: string | null, scheduledAt: Date) => {
    if (status === "completed") return "border-l-green-500";
    if (isFuture(scheduledAt)) return "border-l-blue-500";
    return "border-l-muted-foreground";
  };

  if (sortedSessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No sessions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {sortedSessions.map((session, index) => {
        const sessionDate = new Date(session.scheduledAt!);
        
        return (
          <Link key={session.id} href={`${basePath}/${session.id}`}>
            <div 
              className={`
                relative pl-6 pb-6 border-l-2 
                ${getStatusColor(session.status, sessionDate)}
                hover:bg-muted/30 transition-colors cursor-pointer
                ${index === sortedSessions.length - 1 ? 'border-l-transparent' : ''}
              `}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeSlideUp 0.4s ease-out forwards',
                opacity: 0,
              }}
            >
              {/* Timeline dot */}
              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-current flex items-center justify-center">
                {getStatusIcon(session.status, sessionDate)}
              </div>
              
              <div className="pt-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-sm">{session.title}</p>
                  <Badge 
                    variant={session.status === "completed" ? "secondary" : "outline"}
                    className="text-xs shrink-0"
                  >
                    {session.status === "completed" ? "Completed" : isFuture(sessionDate) ? "Upcoming" : "Scheduled"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {formatSessionDate(sessionDate)} at {format(sessionDate, "h:mm a")}
                </p>
                {showNotes && session.sessionNotes && session.notesVisibleToClient && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>Session notes available</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
