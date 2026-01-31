"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/ui/loading-button";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";
import type { ClientProfile, Session, User } from "@shared/schema";

const quickNoteSchema = z.object({
  clientId: z.string().min(1, "Please select a client"),
  sessionId: z.string().optional(),
  content: z.string().min(1, "Note content is required"),
});

type QuickNoteFormValues = z.infer<typeof quickNoteSchema>;

interface QuickNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper to display client name
function getClientName(client: ClientProfile & { user?: User }): string {
  if (client.user?.firstName || client.user?.lastName) {
    return `${client.user.firstName || ""} ${client.user.lastName || ""}`.trim();
  }
  if (client.user?.email) {
    return client.user.email;
  }
  return `Client #${client.id.slice(0, 8)}`;
}

export function QuickNoteModal({ open, onOpenChange }: QuickNoteModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients } = useQuery<(ClientProfile & { user?: User })[]>({
    queryKey: ["/api/coach/clients"],
  });

  const { data: sessions } = useQuery<Session[]>({
    queryKey: ["/api/coach/sessions"],
  });

  const form = useForm<QuickNoteFormValues>({
    resolver: zodResolver(quickNoteSchema),
    defaultValues: {
      clientId: "",
      sessionId: "",
      content: "",
    },
  });

  const selectedClientId = form.watch("clientId");
  const clientSessions = sessions?.filter(s => s.clientId === selectedClientId) || [];

  const createNote = useMutation({
    mutationFn: async (data: QuickNoteFormValues) => {
      // Use the messages endpoint to create a session note
      if (data.sessionId) {
        return apiRequest("POST", `/api/sessions/${data.sessionId}/messages`, {
          content: data.content,
        });
      }
      // If no session selected, create a general note (could be stored as a message to the most recent session)
      // For now, we'll require a session
      throw new Error("Please select a session for this note");
    },
    onSuccess: () => {
      toast({
        title: "Note added",
        description: "Your note has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coach/sessions"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuickNoteFormValues) => {
    createNote.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Quick Add Note
          </DialogTitle>
          <DialogDescription>
            Add a quick note to a client's session.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("sessionId", "");
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {getClientName(client)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedClientId && (
              <FormField
                control={form.control}
                name="sessionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a session" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientSessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            {session.title} - {new Date(session.scheduledAt).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your note here..."
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <LoadingButton
                type="submit"
                loading={createNote.isPending}
                success={createNote.isSuccess}
                loadingText="Saving..."
              >
                Add Note
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
