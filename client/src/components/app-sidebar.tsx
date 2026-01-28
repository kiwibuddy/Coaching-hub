import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  LayoutDashboard,
  Calendar,
  FileText,
  Target,
  User,
  Users,
  UserPlus,
  Calculator,
  LogOut,
  ChevronUp,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { PWAInstallBanner } from "@/components/pwa-install-button";

interface SidebarProps {
  role: "client" | "coach";
}

const clientNavItems = [
  { title: "Dashboard", url: "/client", icon: LayoutDashboard },
  { title: "Sessions", url: "/client/sessions", icon: Calendar },
  { title: "Resources", url: "/client/resources", icon: FileText },
  { title: "Action Items", url: "/client/actions", icon: Target },
  { title: "Billing", url: "/client/billing", icon: CreditCard },
  { title: "Profile", url: "/client/profile", icon: User },
];

const coachNavItems = [
  { title: "Dashboard", url: "/coach", icon: LayoutDashboard },
  { title: "Clients", url: "/coach/clients", icon: Users },
  { title: "Sessions", url: "/coach/sessions", icon: Calendar },
  { title: "Resources", url: "/coach/resources", icon: FileText },
  { title: "Intake Requests", url: "/coach/intake", icon: UserPlus },
  { title: "Billing", url: "/coach/billing", icon: CreditCard },
  { title: "Analytics", url: "/coach/analytics", icon: BarChart3 },
  { title: "Pricing Calculator", url: "/coach/calculator", icon: Calculator },
];

export function AppSidebar({ role }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = role === "coach" ? coachNavItems : clientNavItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href={role === "coach" ? "/coach" : "/client"}>
          <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-serif text-lg font-bold">Holger Coaching</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-xs tracking-wider">
            {role === "coach" ? "Coach Portal" : "Client Portal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url !== `/${role}` && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <PWAInstallBanner />

      <SidebarFooter className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-3" data-testid="button-user-menu">
              <UserAvatar user={user} className="h-8 w-8" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href={role === "coach" ? "/coach" : "/client/profile"}>
                <User className="mr-2 h-4 w-4" />
                {role === "coach" ? "Settings" : "Profile"}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-destructive" data-testid="menu-logout">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
