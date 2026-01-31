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
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";
import type { ClientProfile, User } from "@shared/schema";

const quickSessionSchema = z.object({
  clientId: z.string().min(1, "Please select a client"),
  title: z.string().min(1, "Title is required"),
  scheduledAt: z.string().min(1, "Date and time is required"),
  duration: z.coerce.number().min(15).max(180),
});

type QuickSessionFormValues = z.infer<typeof quickSessionSchema>;

interface QuickSessionModalProps {
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

export function QuickSessionModal({ open, onOpenChange }: QuickSessionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients } = useQuery<(ClientProfile & { user?: User })[]>({
    queryKey: ["/api/coach/clients"],
  });

  const form = useForm<QuickSessionFormValues>({
    resolver: zodResolver(quickSessionSchema),
    defaultValues: {
      clientId: "",
      title: "Coaching Session",
      scheduledAt: "",
      duration: 60,
    },
  });

  const createSession = useMutation({
    mutationFn: async (data: QuickSessionFormValues) => {
      return apiRequest("POST", "/api/coach/sessions", data);
    },
    onSuccess: () => {
      toast({
        title: "Session scheduled",
        description: "The session has been added to your calendar.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coach/sessions"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to schedule session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuickSessionFormValues) => {
    createSession.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Quick Schedule Session
          </DialogTitle>
          <DialogDescription>
            Quickly schedule a new coaching session.
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
                  <Select onValueChange={field.onChange} value={field.value}>
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

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Coaching Session" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time *</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <Select onValueChange={field.onChange} value={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">120 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <LoadingButton
                type="submit"
                loading={createSession.isPending}
                success={createSession.isSuccess}
                loadingText="Scheduling..."
              >
                Schedule Session
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
