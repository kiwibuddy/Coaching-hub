"use client";

import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { format, subWeeks, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import type { Session } from "@shared/schema";

interface SessionsSparklineProps {
  sessions: Session[];
  weeks?: number;
  height?: number;
  showTooltip?: boolean;
}

export function SessionsSparkline({ 
  sessions, 
  weeks = 4, 
  height = 60,
  showTooltip = true 
}: SessionsSparklineProps) {
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i));
      const weekEnd = endOfWeek(subWeeks(now, i));
      
      const weekSessions = sessions.filter(s => {
        const sessionDate = new Date(s.scheduledAt);
        return isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
      });
      
      const completed = weekSessions.filter(s => s.status === "completed").length;
      const scheduled = weekSessions.filter(s => s.status === "scheduled").length;
      
      data.push({
        week: format(weekStart, "MMM d"),
        completed,
        scheduled,
        total: completed + scheduled,
      });
    }
    
    return data;
  }, [sessions, weeks]);

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return { value: 0, isPositive: true };
    const current = chartData[chartData.length - 1].total;
    const previous = chartData[chartData.length - 2].total;
    if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: true };
    const change = Math.round(((current - previous) / previous) * 100);
    return { value: Math.abs(change), isPositive: change >= 0 };
  }, [chartData]);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          {showTooltip && (
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
                      <p className="text-xs font-medium">{data.week}</p>
                      <p className="text-xs text-muted-foreground">
                        {data.total} session{data.total !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="total"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#colorSessions)"
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
      {trend.value !== 0 && (
        <p className={`text-xs font-medium mt-1 ${
          trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        }`}>
          {trend.isPositive ? "↑" : "↓"} {trend.value}% vs last week
        </p>
      )}
    </div>
  );
}
