import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/stat-card";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react";

interface CoachMetrics {
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

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface SessionsTrend {
  week: string;
  completed: number;
  cancelled: number;
  scheduled: number;
}

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const sessionsChartConfig = {
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-2))",
  },
  cancelled: {
    label: "Cancelled",
    color: "hsl(var(--chart-3))",
  },
  scheduled: {
    label: "Scheduled",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export default function CoachAnalytics() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<CoachMetrics>({
    queryKey: ["/api/coach/analytics"],
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery<MonthlyRevenue[]>({
    queryKey: ["/api/coach/analytics/revenue"],
  });

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery<SessionsTrend[]>({
    queryKey: ["/api/coach/analytics/sessions"],
  });

  const isLoading = metricsLoading || revenueLoading || sessionsLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track your coaching practice performance and growth.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Clients"
          value={metrics?.activeClients || 0}
          description={`of ${metrics?.totalClients || 0} total`}
          icon={Users}
        />
        <StatCard
          title="Completed Sessions"
          value={metrics?.completedSessions || 0}
          description={`${metrics?.sessionCompletionRate || 0}% completion rate`}
          icon={Calendar}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(metrics?.totalRevenue || 0)}
          description={`${formatCurrency(metrics?.pendingPayments || 0)} pending`}
          icon={DollarSign}
        />
        <StatCard
          title="Action Completion"
          value={`${metrics?.actionItemCompletionRate || 0}%`}
          description="Client action items completed"
          icon={Target}
        />
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Calendar className="h-4 w-4 mr-2" />
            Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>
                Revenue trends over the past 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData && revenueData.length > 0 ? (
                <ChartContainer config={revenueChartConfig} className="h-[300px]">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value / 100}`} />
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent 
                          formatter={(value) => formatCurrency(value as number)}
                        />
                      } 
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      fill="var(--color-revenue)"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>No revenue data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Sessions Trend</CardTitle>
              <CardDescription>
                Session activity over the past 8 weeks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsData && sessionsData.length > 0 ? (
                <ChartContainer config={sessionsChartConfig} className="h-[300px]">
                  <BarChart data={sessionsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="completed" fill="var(--color-completed)" stackId="stack" />
                    <Bar dataKey="scheduled" fill="var(--color-scheduled)" stackId="stack" />
                    <Bar dataKey="cancelled" fill="var(--color-cancelled)" stackId="stack" />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>No session data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{metrics?.upcomingSessions || 0}</p>
                <p className="text-xs text-muted-foreground">sessions scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Session Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metrics?.sessionCompletionRate || 0}%</p>
                <p className="text-xs text-muted-foreground">completion rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Client Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{metrics?.actionItemCompletionRate || 0}%</p>
                <p className="text-xs text-muted-foreground">actions completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
