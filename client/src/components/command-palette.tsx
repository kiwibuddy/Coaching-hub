"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useAuth } from "@/hooks/use-auth";
import {
  Calendar,
  Users,
  FileText,
  Upload,
  LayoutDashboard,
  Settings,
  LogOut,
  Search,
  DollarSign,
  User,
  ListTodo,
  BookOpen,
  Clock,
} from "lucide-react";
import type { ClientProfile, Session, User as UserType } from "@shared/schema";

interface CommandPaletteProps {
  onScheduleSession?: () => void;
  onAddNote?: () => void;
}

interface ClientWithUser extends ClientProfile {
  user?: UserType;
}

export function CommandPalette({ onScheduleSession, onAddNote }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();

  const isCoach = user?.role === "coach";

  // Fetch data for search
  const { data: clients } = useQuery<ClientWithUser[]>({
    queryKey: ["/api/coach/clients"],
    enabled: isCoach && open,
  });

  const { data: sessions } = useQuery<Session[]>({
    queryKey: isCoach ? ["/api/coach/sessions"] : ["/api/client/sessions"],
    enabled: open,
  });

  // Keyboard shortcut to open command palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      // Cmd+D for dashboard
      if (e.key === "d" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        setLocation(isCoach ? "/coach/dashboard" : "/client/dashboard");
      }

      // Cmd+Shift+S for schedule session (coach only)
      if (e.key === "s" && (e.metaKey || e.ctrlKey) && e.shiftKey && isCoach) {
        e.preventDefault();
        onScheduleSession?.();
      }

      // Cmd+Shift+N for add note (coach only)
      if (e.key === "n" && (e.metaKey || e.ctrlKey) && e.shiftKey && isCoach) {
        e.preventDefault();
        onAddNote?.();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setLocation, isCoach, onScheduleSession, onAddNote]);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const getClientName = (client: ClientWithUser) => {
    if (client.user?.firstName || client.user?.lastName) {
      return `${client.user.firstName || ""} ${client.user.lastName || ""}`.trim();
    }
    return client.user?.email || `Client #${client.id.slice(0, 8)}`;
  };

  // Navigation items based on role
  const coachNavigation = [
    { name: "Dashboard", href: "/coach/dashboard", icon: LayoutDashboard, shortcut: "⌘D" },
    { name: "Clients", href: "/coach/clients", icon: Users, shortcut: "⌘1" },
    { name: "Sessions", href: "/coach/sessions", icon: Calendar, shortcut: "⌘2" },
    { name: "Billing", href: "/coach/billing", icon: DollarSign, shortcut: "⌘3" },
    { name: "Resources", href: "/coach/resources", icon: BookOpen, shortcut: "⌘4" },
    { name: "Settings", href: "/coach/setup", icon: Settings },
  ];

  const clientNavigation = [
    { name: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard, shortcut: "⌘D" },
    { name: "Sessions", href: "/client/sessions", icon: Calendar, shortcut: "⌘1" },
    { name: "Action Items", href: "/client/actions", icon: ListTodo, shortcut: "⌘2" },
    { name: "Resources", href: "/client/resources", icon: BookOpen, shortcut: "⌘3" },
    { name: "Profile", href: "/client/profile", icon: User, shortcut: "⌘4" },
  ];

  const navigation = isCoach ? coachNavigation : clientNavigation;

  // Coach-only quick actions
  const coachActions = [
    { 
      name: "Schedule Session", 
      icon: Calendar, 
      shortcut: "⌘⇧S",
      action: () => onScheduleSession?.(),
    },
    { 
      name: "Add Note", 
      icon: FileText, 
      shortcut: "⌘⇧N",
      action: () => onAddNote?.(),
    },
    { 
      name: "Upload Resource", 
      icon: Upload, 
      shortcut: "⌘⇧U",
      action: () => setLocation("/coach/resources"),
    },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions (Coach only) */}
        {isCoach && (
          <CommandGroup heading="Quick Actions">
            {coachActions.map((action) => (
              <CommandItem
                key={action.name}
                onSelect={() => runCommand(action.action)}
              >
                <action.icon className="mr-2 h-4 w-4" />
                <span>{action.name}</span>
                <CommandShortcut>{action.shortcut}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          {navigation.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => runCommand(() => setLocation(item.href))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
              {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Search Clients (Coach only) */}
        {isCoach && clients && clients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Clients">
              {clients.slice(0, 5).map((client) => (
                <CommandItem
                  key={client.id}
                  onSelect={() => runCommand(() => setLocation(`/coach/clients/${client.id}`))}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>{getClientName(client)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Recent Sessions */}
        {sessions && sessions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Sessions">
              {sessions.slice(0, 3).map((session) => (
                <CommandItem
                  key={session.id}
                  onSelect={() => runCommand(() => 
                    setLocation(isCoach 
                      ? `/coach/sessions/${session.id}` 
                      : `/client/sessions/${session.id}`
                    )
                  )}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  <span>{session.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        {/* Account */}
        <CommandGroup heading="Account">
          <CommandItem
            onSelect={() => runCommand(() => logoutMutation.mutate())}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
