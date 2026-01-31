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
import type { Session, Message, ClientProfile } from "@shared/schema";

type ClientProfileWithUser = ClientProfile & {
  user?: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
};
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  FileText,
  MessageSquare,
  Send,
  CalendarPlus,
  User as UserIcon,
  Loader2,
} from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";
import { Checkbox } from "@/components/ui/checkbox";

const notesSchema = z.object({
  sessionNotes: z.string(),
  notesVisibleToClient: z.boolean(),
});

export default function CoachSessionDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading: sessionLoading } = useQuery<Session>({
    queryKey: [`/api/coach/sessions/${id}`],
    enabled: !!id,
  });

  const { data: clients } = useQuery<ClientProfileWithUser[]>({
    queryKey: ["/api/coach/clients"],
    enabled: !!session?.clientId,
  });

  const { data: messages, refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: [`/api/sessions/${id}/messages`],
    enabled: !!id,
    refetchInterval: 5000,
  });

  const { user } = useAuth();

  const messageForm = useForm<{ content: string }>({
    resolver: zodResolver(z.object({ content: z.string().min(1, "Message cannot be empty") })),
    defaultValues: { content: "" },
  });

  const notesForm = useForm<z.infer<typeof notesSchema>>({
    resolver: zodResolver(notesSchema),
    values: session
      ? {
          sessionNotes: session.sessionNotes ?? "",
          notesVisibleToClient: session.notesVisibleToClient ?? false,
        }
      : undefined,
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

  const saveNotes = useMutation({
    mutationFn: async (data: z.infer<typeof notesSchema>) => {
      return apiRequest("PATCH", `/api/coach/sessions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/coach/sessions/${id}`] });
      toast({
        title: "Notes Saved",
        description: "Session notes have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save notes. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        <Link href="/coach/sessions">
          <Button variant="link" data-testid="button-back-sessions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
        </Link>
      </div>
    );
  }

  const client = clients?.find((c) => c.id === session.clientId);
  const clientName = client?.user
    ? [client.user.firstName, client.user.lastName].filter(Boolean).join(" ") || client.user.email || `Client #${session.clientId.slice(0, 8)}`
    : `Client #${session.clientId.slice(0, 8)}`;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/coach/sessions">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-bold tracking-tight">{session.title}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <Badge
              variant={
                session.status === "completed"
                  ? "default"
                  : session.status === "cancelled"
                    ? "destructive"
                    : "secondary"
              }
            >
              {session.status === "pending_confirmation"
                ? session.requestedBy === "client"
                  ? "Client Request"
                  : "Awaiting Client"
                : session.status}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <UserIcon className="h-3.5 w-3.5" />
              {clientName}
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(session.scheduledAt), "MMMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session.status === "scheduled" && (
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
                  <h4 className="text-sm font-medium mb-2">Pre-session Notes (visible to client)</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {session.prepNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Notes (editable) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Session Notes
              </CardTitle>
              <CardDescription>Your private notes. Toggle visibility to share with the client.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notesForm}>
                <form
                  onSubmit={notesForm.handleSubmit((data) => saveNotes.mutate(data))}
                  className="space-y-4"
                >
                  <FormField
                    control={notesForm.control}
                    name="sessionNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Session notes and takeaways..."
                            className="min-h-[160px]"
                            {...field}
                            data-testid="textarea-session-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={notesForm.control}
                    name="notesVisibleToClient"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-notes-visible"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Visible to client</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            When enabled, the client can see these notes on their session page.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  <LoadingButton
                    type="submit"
                    loading={saveNotes.isPending}
                    loadingText="Saving..."
                    data-testid="button-save-notes"
                  >
                    Save Notes
                  </LoadingButton>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Messages
              </CardTitle>
              <CardDescription>Communicate with the client about this session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                              isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {message.createdAt
                                ? format(new Date(message.createdAt), "MMM d, h:mm a")
                                : ""}
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
        </div>

        {/* Sidebar placeholder for layout consistency */}
        <div className="space-y-6" />
      </div>
    </div>
  );
}
