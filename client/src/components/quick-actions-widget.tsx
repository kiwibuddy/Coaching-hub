"use client";

import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  FileText, 
  DollarSign, 
  Upload,
  Command,
} from "lucide-react";
import { QuickSessionModal } from "@/components/modals/quick-session-modal";
import { QuickNoteModal } from "@/components/modals/quick-note-modal";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  onClick?: () => void;
  href?: string;
}

interface QuickActionsWidgetProps {
  className?: string;
}

export function QuickActionsWidget({ className }: QuickActionsWidgetProps) {
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  const actions: QuickAction[] = [
    {
      id: "schedule",
      label: "Schedule Session",
      icon: Calendar,
      shortcut: "⌘⇧S",
      onClick: () => setSessionModalOpen(true),
    },
    {
      id: "note",
      label: "Add Note",
      icon: FileText,
      shortcut: "⌘⇧N",
      onClick: () => setNoteModalOpen(true),
    },
    {
      id: "invoice",
      label: "Create Invoice",
      icon: DollarSign,
      shortcut: "⌘⇧I",
      href: "/coach/billing",
    },
    {
      id: "resource",
      label: "Upload Resource",
      icon: Upload,
      shortcut: "⌘⇧U",
      href: "/coach/resources",
    },
  ];

  return (
    <>
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Command className="h-3 w-3" />
              <span>K to search</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              const content = (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={action.onClick}
                  className={cn(
                    "group relative flex flex-col items-center justify-center gap-2 p-4 rounded-lg",
                    "bg-muted/50 hover:bg-muted border border-transparent hover:border-primary/20",
                    "transition-all duration-200 cursor-pointer w-full text-left"
                  )}
                >
                  <div className="rounded-full bg-primary/10 p-2.5 group-hover:bg-primary/20 transition-colors">
                    <ActionIcon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-center">{action.label}</span>
                  {action.shortcut && (
                    <span className="absolute top-2 right-2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {action.shortcut}
                    </span>
                  )}
                </motion.button>
              );

              if (action.href) {
                return (
                  <Link key={action.id} href={action.href}>
                    {content}
                  </Link>
                );
              }

              return content;
            })}
          </div>
        </CardContent>
      </Card>

      <QuickSessionModal 
        open={sessionModalOpen} 
        onOpenChange={setSessionModalOpen} 
      />
      <QuickNoteModal 
        open={noteModalOpen} 
        onOpenChange={setNoteModalOpen} 
      />
    </>
  );
}
