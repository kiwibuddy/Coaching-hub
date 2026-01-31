import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { useToast } from "@/hooks/use-toast";
import { LoadingButton } from "@/components/ui/loading-button";
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
  Plus,
  Upload,
  Download,
} from "lucide-react";
import { useState } from "react";

const actionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
});

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

type ActionFormValues = z.infer<typeof actionSchema>;
type ResourceFormValues = z.infer<typeof resourceSchema>;

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<string>("sessions");
  const [actionReviewId, setActionReviewId] = useState<string | null>(null);

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

  const { uploadFile } = useUpload({
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const actionForm = useForm<ActionFormValues>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      status: "pending",
    },
  });

  const resourceForm = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const createAction = useMutation({
    mutationFn: async (data: ActionFormValues) => {
      return apiRequest("POST", "/api/coach/actions", {
        clientId: clientId!,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate || undefined,
        status: data.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach/actions"] });
      toast({
        title: "Action Item Added",
        description: "The action item has been assigned to this client.",
      });
      actionForm.reset();
      setActionDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add action item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createResource = useMutation({
    mutationFn: async (data: ResourceFormValues & { fileUrl?: string; fileType?: string; fileName?: string }) => {
      return apiRequest("POST", "/api/coach/resources", {
        ...data,
        clientId: clientId!,
        isGlobal: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach/resources"] });
      toast({
        title: "Resource Added",
        description: "The resource has been shared with this client.",
      });
      resourceForm.reset();
      setResourceFile(null);
      setResourceDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleResourceSubmit = async (data: ResourceFormValues) => {
    let fileUrl = "";
    let fileType = "";
    let fileName = "";
    if (resourceFile) {
      const result = await uploadFile(resourceFile);
      if (result) {
        fileUrl = result.objectPath;
        fileType = resourceFile.type.split("/")[1] || "file";
        fileName = resourceFile.name;
      }
    }
    createResource.mutate({ ...data, fileUrl, fileType, fileName });
  };

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

      {/* Overview Cards – click to open that tab’s full detail */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab("sessions")}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab("sessions")}
        >
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
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab("actions")}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab("actions")}
        >
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
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab("resources")}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab("resources")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientResources.length}</div>
            <p className="text-xs text-muted-foreground">private + global</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab("sessions")}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab("sessions")}
        >
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

      {/* Tabs for Sessions, Actions, Resources (switched when you click a summary card) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientSessions.length > 0 ? (
                  clientSessions
                    .sort((a, b) => new Date(b.scheduledAt!).getTime() - new Date(a.scheduledAt!).getTime())
                    .map((session) => (
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
                        <TableCell className="text-right">
                          <Link href={`/coach/sessions/${session.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Action Items</CardTitle>
                <CardDescription>Private to this client. Only you and the client can see these.</CardDescription>
              </div>
              <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-action">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Action Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Action Item</DialogTitle>
                    <DialogDescription>
                      Assign a new action item to {getClientName()}. The client will see it on their Action Items page.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...actionForm}>
                    <form
                      onSubmit={actionForm.handleSubmit((data) => createAction.mutate(data))}
                      className="space-y-4"
                    >
                      <FormField
                        control={actionForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Complete reflection worksheet" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={actionForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Optional details..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={actionForm.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <LoadingButton
                          type="submit"
                          loading={createAction.isPending}
                          loadingText="Adding..."
                        >
                          Add Action Item
                        </LoadingButton>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {clientActions.length > 0 ? (
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
                    {clientActions
                      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
                      .map((action) => (
                        <TableRow
                          key={action.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setActionReviewId(action.id)}
                        >
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
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={Target}
                  title="No action items"
                  description="Add an action item to assign tasks to this client."
                  actionLabel="Add Action Item"
                  onAction={() => setActionDialogOpen(true)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Resources</CardTitle>
                <CardDescription>Private resources for this client plus global resources visible to all clients.</CardDescription>
              </div>
              <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-resource">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Resource
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Resource</DialogTitle>
                    <DialogDescription>
                      Share a resource with {getClientName()}. Summary notes, readings, or files specific to your sessions.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...resourceForm}>
                    <form
                      onSubmit={resourceForm.handleSubmit(handleResourceSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={resourceForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Session summary notes" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={resourceForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Optional description..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                        <FormLabel>File (optional)</FormLabel>
                        <div className="mt-2 border-2 border-dashed rounded-lg p-4 text-center">
                          <input
                            type="file"
                            className="hidden"
                            id="client-resource-file"
                            onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                          />
                          <label htmlFor="client-resource-file" className="cursor-pointer">
                            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                            {resourceFile ? (
                              <p className="text-sm font-medium">{resourceFile.name}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground">Click to upload a file</p>
                            )}
                          </label>
                        </div>
                      </div>
                      <DialogFooter>
                        <LoadingButton
                          type="submit"
                          loading={createResource.isPending}
                          loadingText="Adding..."
                        >
                          Add Resource
                        </LoadingButton>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {clientResources.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead className="w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientResources
                      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
                      .map((resource) => (
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
                          <TableCell>
                            {resource.fileUrl && (
                              <Button size="sm" variant="ghost" asChild>
                                <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No resources"
                  description="Add a resource to share notes or files with this client."
                  actionLabel="Add Resource"
                  onAction={() => setResourceDialogOpen(true)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action item review – open when you click an action row */}
      <Dialog open={!!actionReviewId} onOpenChange={(open) => !open && setActionReviewId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Action item</DialogTitle>
            <DialogDescription>Review details for this action item.</DialogDescription>
          </DialogHeader>
          {actionReviewId && (() => {
            const action = clientActions.find((a) => a.id === actionReviewId);
            if (!action) return null;
            return (
              <div className="space-y-4 py-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Title</p>
                  <p className="font-medium">{action.title}</p>
                </div>
                {action.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm">{action.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Due date</p>
                  <p className="text-sm">
                    {action.dueDate
                      ? format(new Date(action.dueDate), "MMMM d, yyyy")
                      : "No due date"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
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
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionReviewId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
