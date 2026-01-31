import { useState, useEffect, useMemo } from "react";

interface CountdownResult {
  /** Days remaining */
  days: number;
  /** Hours remaining (0-23) */
  hours: number;
  /** Minutes remaining (0-59) */
  minutes: number;
  /** Seconds remaining (0-59) */
  seconds: number;
  /** Total milliseconds remaining */
  totalMs: number;
  /** Whether the countdown is within 1 hour */
  isApproaching: boolean;
  /** Whether the countdown is within 15 minutes */
  isUrgent: boolean;
  /** Whether the countdown is within 5 minutes */
  isImminent: boolean;
  /** Whether the target time has passed */
  isPast: boolean;
  /** Formatted string like "2h 45m" or "15 min" */
  formatted: string;
}

function calculateTimeLeft(targetDate: Date): CountdownResult {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  const isPast = diff <= 0;
  const totalMs = Math.max(0, diff);
  
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);
  
  const isApproaching = totalMs <= 60 * 60 * 1000; // 1 hour
  const isUrgent = totalMs <= 15 * 60 * 1000; // 15 minutes
  const isImminent = totalMs <= 5 * 60 * 1000; // 5 minutes
  
  // Format the countdown string
  let formatted: string;
  if (isPast) {
    formatted = "Started";
  } else if (days > 0) {
    formatted = `${days}d ${hours}h`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    formatted = `${minutes} min`;
  } else {
    formatted = `${seconds}s`;
  }
  
  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs,
    isApproaching,
    isUrgent,
    isImminent,
    isPast,
    formatted,
  };
}

/**
 * Hook that returns a countdown to a target date, updating in real-time.
 * Updates every minute by default, every second when within 5 minutes.
 */
export function useCountdown(targetDate: Date | string | null): CountdownResult | null {
  const target = useMemo(() => {
    if (!targetDate) return null;
    return typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  }, [targetDate]);
  
  const [timeLeft, setTimeLeft] = useState<CountdownResult | null>(() => 
    target ? calculateTimeLeft(target) : null
  );
  
  useEffect(() => {
    if (!target) {
      setTimeLeft(null);
      return;
    }
    
    // Initial calculation
    const result = calculateTimeLeft(target);
    setTimeLeft(result);
    
    // Don't continue if the event has passed
    if (result.isPast) return;
    
    // Update interval based on urgency
    const getInterval = () => {
      const current = calculateTimeLeft(target);
      if (current.isImminent) return 1000; // Every second when < 5 min
      if (current.isUrgent) return 10000; // Every 10 seconds when < 15 min
      return 60000; // Every minute otherwise
    };
    
    let intervalId: NodeJS.Timeout;
    
    const tick = () => {
      const result = calculateTimeLeft(target);
      setTimeLeft(result);
      
      if (result.isPast) {
        clearInterval(intervalId);
        return;
      }
      
      // Adjust interval dynamically
      clearInterval(intervalId);
      intervalId = setInterval(tick, getInterval());
    };
    
    intervalId = setInterval(tick, getInterval());
    
    return () => clearInterval(intervalId);
  }, [target]);
  
  return timeLeft;
}
