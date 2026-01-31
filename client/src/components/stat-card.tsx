"use client";

import { useMemo } from "react";
import { type LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/animated-counter";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
}

function MiniSparkline({ 
  data, 
  width = 60, 
  height = 24, 
  color = "hsl(var(--primary))",
  showArea = true 
}: SparklineProps) {
  const pathData = useMemo(() => {
    if (!data || data.length < 2) return { linePath: "", areaPath: "" };
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return { x, y };
    });
    
    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
    
    const areaPath = showArea
      ? `${linePath} L ${width} ${height} L 0 ${height} Z`
      : "";
    
    return { linePath, areaPath };
  }, [data, width, height, showArea]);

  if (!data || data.length < 2) return null;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {showArea && (
        <path
          d={pathData.areaPath}
          fill={color}
          fillOpacity={0.15}
        />
      )}
      <path
        d={pathData.linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  href?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  /** Optional sparkline data (array of values for the last N periods) */
  sparklineData?: number[];
  index?: number;
}

export function StatCard({ title, value, description, icon: Icon, href, trend, sparklineData, index = 0 }: StatCardProps) {
  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      <Card className={`hover-elevate hover-glow transition-all duration-300 stat-card-premium ${href ? 'cursor-pointer hover:border-primary/50' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold tracking-tight">
                {typeof value === "number" ? (
                  <AnimatedCounter value={value} duration={0.8} />
                ) : (
                  value
                )}
              </p>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
              {trend && (
                <p
                  className={`text-xs font-medium ${
                    trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {trend.isPositive ? "↑" : "↓"} {trend.value}% from last month
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {sparklineData && sparklineData.length >= 2 && (
                <MiniSparkline data={sparklineData} />
              )}
              <motion.div 
                className="rounded-full bg-primary/10 p-3"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Icon className="h-5 w-5 text-primary" />
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}
