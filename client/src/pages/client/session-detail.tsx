import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { FormSkeleton } from "@/components/loading-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useRef } from "react";
import type { Session, Resource, ActionItem, Message } from "@shared/schema";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  FileText,
  Target,
  Download,
  Loader2,
  MessageSquare,
  Send,
  CalendarPlus,
  Check,
  RefreshCw,
} from "lucide-react";

interface CalendarStatus {
  enabled: boolean;
  connected: boolean;
}

const reflectionSchema = z.object({
  reflection: z.string().min(10, "Please write at least 10 characters"),
});

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: session, isLoading: sessionLoading } = useQuery<Session>({
    queryKey: ["/api/client/sessions", id],
  });

  const { data: calendarStatus } = useQuery<CalendarStatus>({
    queryKey: ["/api/calendar/status"],
  });

  const syncToCalendar = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/sessions/${id}/sync-calendar`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/sessions", id] });
      toast({
        title: "Session Synced",
        description: "This session has been added to your Google Calendar.",
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Could not sync to Google Calendar. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: resources } = useQuery<Resource[]>({
    queryKey: ["/api/client/sessions", id, "resources"],
    enabled: !!id,
  });

  const { data: actionItems } = useQuery<ActionItem[]>({
    queryKey: ["/api/client/sessions", id, "actions"],
    enabled: !!id,
  });

  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages with polling (every 5 seconds)
  const { data: messages, refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/sessions", id, "messages"],
    enabled: !!id,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const messageForm = useForm<{ content: string }>({
    resolver: zodResolver(z.object({ content: z.string().min(1, "Message cannot be empty") })),
    defaultValues: { content: "" },
  });

  const sendMessage = useMutation({
    mutationFn: async (data: { content: string }) => {
      return apiRequest("POST", `/api/sessions/${id}/messages`, data);
    },
    onSuccess: () => {
      messageForm.reset();
      refetchMessages();
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const form = useForm<z.infer<typeof reflectionSchema>>({
    resolver: zodResolver(reflectionSchema),
    defaultValues: {
      reflection: session?.clientReflection || "",
    },
  });

  const saveReflection = useMutation({
    mutationFn: async (data: { reflection: string }) => {
      return apiRequest("PATCH", `/api/client/sessions/${id}/reflection`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/sessions", id] });
      toast({
        title: "Reflection Saved",
        description: "Your reflection has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save reflection. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (sessionLoading) {
    return (
      <div className="p-6">
        <FormSkeleton />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Session not found.</p>
        <Link href="/client/sessions">
          <Button variant="link" data-testid="button-back-sessions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
        </Link>
      </div>
    );
  }

  const isCompleted = session.status === "completed";

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/client/sessions">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-bold tracking-tight">{session.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge 
              variant={
                session.status === "completed" ? "default" : 
                session.status === "cancelled" ? "destructive" : 
                "secondary"
              }
            >
              {session.status}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(session.scheduledAt), "MMMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session.status === "scheduled" && calendarStatus?.connected && (
            <Button
              variant="outline"
              onClick={() => syncToCalendar.mutate()}
              disabled={syncToCalendar.isPending}
              data-testid="button-sync-calendar"
            >
              {syncToCalendar.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : session.googleCalendarEventId ? (
                <RefreshCw className="mr-2 h-4 w-4" />
              ) : (
                <CalendarPlus className="mr-2 h-4 w-4" />
              )}
              {session.googleCalendarEventId ? "Update Calendar" : "Sync to Google"}
            </Button>
          )}
          {session.status === "scheduled" && !calendarStatus?.connected && (
            <Button asChild variant="outline" data-testid="button-add-to-calendar">
              <a href={`/api/sessions/${id}/export-ics`} download>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Add to Calendar
              </a>
            </Button>
          )}
          {session.meetingLink && session.status === "scheduled" && (
            <Button asChild data-testid="button-join-meeting">
              <a href={session.meetingLink} target="_blank" rel="noopener noreferrer">
                <Video className="mr-2 h-4 w-4" />
                Join Meeting
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Session Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(session.scheduledAt), "EEEE, MMMM d")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="text-sm font-medium">
                      {format(new Date(session.scheduledAt), "h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium">{session.duration} minutes</p>
                  </div>
                </div>
              </div>

              {session.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{session.description}</p>
                </div>
              )}

              {session.prepNotes && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Pre-session Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {session.prepNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coach Notes */}
          {session.sessionNotes && session.notesVisibleToClient && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Session Notes
                </CardTitle>
                <CardDescription>Notes from your coach</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {session.sessionNotes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Messages
              </CardTitle>
              <CardDescription>Communicate with your coach about this session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Messages List */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto border rounded-lg p-4 bg-muted/30">
                  {messages && messages.length > 0 ? (
                    messages.map((message) => {
                      const isOwnMessage = message.senderId === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              isOwnMessage
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}>
                              {message.createdAt ? format(new Date(message.createdAt), "MMM d, h:mm a") : ""}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No messages yet. Start the conversation!
                    </p>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <Form {...messageForm}>
                  <form
                    onSubmit={messageForm.handleSubmit((data) => sendMessage.mutate(data))}
                    className="flex gap-2"
                  >
                    <FormField
                      control={messageForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Type your message..."
                              {...field}
                              data-testid="input-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={sendMessage.isPending}
                      data-testid="button-send-message"
                    >
                      {sendMessage.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </CardContent>
          </Card>

          {/* Reflection */}
          {isCompleted && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Your Reflection
                </CardTitle>
                <CardDescription>Share your thoughts on this session</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((data) => saveReflection.mutate(data))}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="reflection"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="What insights did you gain? What will you apply from this session?"
                              className="min-h-[120px]"
                              {...field}
                              data-testid="textarea-reflection"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      disabled={saveReflection.isPending}
                      data-testid="button-save-reflection"
                    >
                      {saveReflection.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Reflection"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resources && resources.length > 0 ? (
                <div className="space-y-3">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{resource.title}</p>
                        {resource.fileType && (
                          <p className="text-xs text-muted-foreground uppercase">
                            {resource.fileType}
                          </p>
                        )}
                      </div>
                      {resource.fileUrl && (
                        <Button
                          size="icon"
                          variant="ghost"
                          asChild
                          data-testid={`button-download-${resource.id}`}
                        >
                          <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No resources for this session.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Action Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actionItems && actionItems.length > 0 ? (
                <div className="space-y-3">
                  {actionItems.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          action.status === "completed"
                            ? "bg-green-500"
                            : action.status === "in_progress"
                            ? "bg-amber-500"
                            : "bg-muted-foreground"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          action.status === "completed" ? "line-through text-muted-foreground" : ""
                        }`}>
                          {action.title}
                        </p>
                        {action.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            Due {format(new Date(action.dueDate), "MMM d")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No action items for this session.
                </p>
              )}
              <Link href="/client/actions">
                <Button variant="outline" className="w-full mt-4" data-testid="button-view-all-actions">
                  View All Actions
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
