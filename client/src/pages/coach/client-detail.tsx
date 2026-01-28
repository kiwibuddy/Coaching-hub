import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import type { ClientProfile, Session, ActionItem, Resource } from "@shared/schema";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Target,
  Calendar,
  CheckSquare,
  FileText,
  BarChart3,
} from "lucide-react";

// Extended type with user data from the API
type ClientProfileWithUser = ClientProfile & {
  user?: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

export default function CoachClientDetail() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;

  const { data: client, isLoading: clientLoading } = useQuery<ClientProfileWithUser>({
    queryKey: [`/api/coach/clients/${clientId}`],
    enabled: !!clientId,
  });

  const { data: sessions } = useQuery<Session[]>({
    queryKey: ["/api/coach/sessions"],
  });

  const { data: actions } = useQuery<ActionItem[]>({
    queryKey: ["/api/coach/actions"],
  });

  const { data: resources } = useQuery<Resource[]>({
    queryKey: ["/api/coach/resources"],
  });

  const { data: analytics } = useQuery<{
    totalSessions: number;
    completedSessions: number;
    totalActionItems: number;
    completedActionItems: number;
    engagementScore: number;
  }>({
    queryKey: [`/api/coach/clients/${clientId}/analytics`],
    enabled: !!clientId,
  });

  if (clientLoading) {
    return <DashboardSkeleton />;
  }

  if (!client) {
    return (
      <div className="p-6">
        <EmptyState
          icon={User}
          title="Client not found"
          description="This client profile does not exist or has been removed."
          actionLabel="Back to Clients"
          onAction={() => (window.location.href = "/coach/clients")}
        />
      </div>
    );
  }

  // Filter data for this specific client
  const clientSessions = sessions?.filter((s) => s.clientId === clientId) || [];
  const clientActions = actions?.filter((a) => a.clientId === clientId) || [];
  const clientResources = resources?.filter((r) => r.clientId === clientId || r.isGlobal) || [];

  // Helper to get display name
  const getClientName = () => {
    if (client.user?.firstName && client.user?.lastName) {
      return `${client.user.firstName} ${client.user.lastName}`;
    }
    if (client.user?.email) {
      return client.user.email;
    }
    return `Client #${client.id.slice(0, 8)}`;
  };

  const upcomingSessions = clientSessions.filter(
    (s) => new Date(s.scheduledAt!) > new Date() && s.status !== "cancelled"
  );
  const pendingActions = clientActions.filter((a) => a.status === "pending" || a.status === "in_progress");

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/coach/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-serif text-3xl font-bold tracking-tight">{getClientName()}</h1>
          <p className="text-muted-foreground">Client profile and activity</p>
        </div>
        <Badge
          variant={
            client.status === "active"
              ? "default"
              : client.status === "paused"
              ? "secondary"
              : "outline"
          }
          className="text-sm"
        >
          {client.status}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalSessions ?? clientSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingSessions.length} upcoming
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Items</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalActionItems ?? clientActions.length}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.completedActionItems ?? clientActions.filter((a) => a.status === "completed").length} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientResources.length}</div>
            <p className="text-xs text-muted-foreground">shared with client</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.engagementScore ?? 0}%</div>
            <p className="text-xs text-muted-foreground">engagement score</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Profile details and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Name:</span>
                <span>{getClientName()}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span>{client.user?.email || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Phone:</span>
                <span>{client.phone || "Not provided"}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Target className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <span className="font-medium">Goals:</span>
                  <p className="text-muted-foreground mt-1">{client.goals || "No goals specified"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Client since:</span>
                <span>{format(new Date(client.createdAt!), "MMMM d, yyyy")}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Sessions, Actions, Resources */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">
            Sessions ({clientSessions.length})
          </TabsTrigger>
          <TabsTrigger value="actions">
            Actions ({clientActions.length})
          </TabsTrigger>
          <TabsTrigger value="resources">
            Resources ({clientResources.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientSessions.length > 0 ? (
                  clientSessions.slice(0, 10).map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.title}</TableCell>
                      <TableCell>
                        {format(new Date(session.scheduledAt!), "MMM d, yyyy 'at' h:mm a")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            session.status === "completed"
                              ? "default"
                              : session.status === "cancelled"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{session.duration} min</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No sessions scheduled yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action Item</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientActions.length > 0 ? (
                  clientActions.slice(0, 10).map((action) => (
                    <TableRow key={action.id}>
                      <TableCell className="font-medium">{action.title}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {action.description || "-"}
                      </TableCell>
                      <TableCell>
                        {action.dueDate
                          ? format(new Date(action.dueDate), "MMM d, yyyy")
                          : "No due date"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            action.status === "completed"
                              ? "default"
                              : action.status === "in_progress"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {action.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No action items assigned yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Scope</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientResources.length > 0 ? (
                  clientResources.slice(0, 10).map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell className="font-medium">{resource.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{resource.fileType || "file"}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(resource.createdAt!), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={resource.isGlobal ? "secondary" : "default"}>
                          {resource.isGlobal ? "Global" : "Personal"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No resources shared yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
