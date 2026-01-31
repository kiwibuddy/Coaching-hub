"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, Video, ExternalLink } from "lucide-react";

interface SessionCountdownProps {
  /** The session's scheduled start time */
  scheduledAt: Date | string;
  /** Optional meeting link for "Join Now" button */
  meetingLink?: string | null;
  /** Show only within this many hours (default: 24) */
  showWithinHours?: number;
  /** Size variant */
  size?: "sm" | "default" | "lg";
  /** Show as badge style */
  variant?: "badge" | "inline" | "card";
  /** Additional class names */
  className?: string;
}

export function SessionCountdown({
  scheduledAt,
  meetingLink,
  showWithinHours = 24,
  size = "default",
  variant = "inline",
  className,
}: SessionCountdownProps) {
  const countdown = useCountdown(scheduledAt);
  
  // Don't show if no countdown or event has passed
  if (!countdown) return null;
  if (countdown.isPast) return null;
  
  // Don't show if outside the display window
  const hoursRemaining = countdown.totalMs / (1000 * 60 * 60);
  if (hoursRemaining > showWithinHours) return null;
  
  const showJoinButton = countdown.isUrgent && meetingLink;
  
  // Determine styling based on urgency
  const getVariantStyles = () => {
    if (countdown.isImminent) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
    }
    if (countdown.isUrgent) {
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
    }
    if (countdown.isApproaching) {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    }
    return "bg-muted text-muted-foreground";
  };
  
  const sizeStyles = {
    sm: "text-xs px-2 py-0.5",
    default: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };
  
  if (variant === "badge") {
    return (
      <Badge
        variant="outline"
        className={cn(
          getVariantStyles(),
          sizeStyles[size],
          countdown.isImminent && "animate-pulse",
          className
        )}
      >
        <Clock className={cn(
          "mr-1",
          size === "sm" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"
        )} />
        {countdown.isImminent ? "Starting soon!" : `Starts in ${countdown.formatted}`}
      </Badge>
    );
  }
  
  if (variant === "card") {
    return (
      <div className={cn(
        "flex items-center justify-between gap-3 p-3 rounded-lg border",
        getVariantStyles(),
        countdown.isImminent && "animate-pulse",
        className
      )}>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="font-medium">
            {countdown.isImminent ? "Starting soon!" : `Starts in ${countdown.formatted}`}
          </span>
        </div>
        {showJoinButton && (
          <Button
            size="sm"
            variant="default"
            className="gap-1"
            onClick={() => window.open(meetingLink!, "_blank")}
          >
            <Video className="h-3.5 w-3.5" />
            Join Now
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }
  
  // Default inline variant
  return (
    <span className={cn(
      "inline-flex items-center gap-1 font-medium",
      countdown.isImminent ? "text-red-600 dark:text-red-400" :
      countdown.isUrgent ? "text-amber-600 dark:text-amber-400" :
      countdown.isApproaching ? "text-blue-600 dark:text-blue-400" :
      "text-muted-foreground",
      countdown.isImminent && "animate-pulse",
      sizeStyles[size],
      className
    )}>
      <Clock className={cn(
        size === "sm" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"
      )} />
      {countdown.isImminent ? "Starting soon!" : countdown.formatted}
      {showJoinButton && (
        <Button
          size="sm"
          variant="link"
          className="h-auto p-0 ml-1 gap-1 text-current"
          onClick={() => window.open(meetingLink!, "_blank")}
        >
          Join
          <ExternalLink className="h-3 w-3" />
        </Button>
      )}
    </span>
  );
}
