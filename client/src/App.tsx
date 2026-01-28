import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import NotFound from "@/pages/not-found";

// Public pages
import LandingPage from "@/pages/landing";
import IntakePage from "@/pages/intake";

// Client pages
import ClientDashboard from "@/pages/client/dashboard";
import ClientSessions from "@/pages/client/sessions";
import ClientSessionDetail from "@/pages/client/session-detail";
import ClientActions from "@/pages/client/actions";
import ClientResources from "@/pages/client/resources";
import ClientProfile from "@/pages/client/profile";
import ClientBilling from "@/pages/client/billing";

// Coach pages
import CoachDashboard from "@/pages/coach/dashboard";
import CoachClients from "@/pages/coach/clients";
import CoachClientDetail from "@/pages/coach/client-detail";
import CoachSessions from "@/pages/coach/sessions";
import CoachIntake from "@/pages/coach/intake";
import CoachResources from "@/pages/coach/resources";
import CoachCalculator from "@/pages/coach/calculator";
import CoachBilling from "@/pages/coach/billing";
import CoachAnalytics from "@/pages/coach/analytics";

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: "coach" | "client" }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  // Check role if specified
  if (role) {
    const userRole = user?.role;
    
    if (role === "coach" && userRole !== "coach") {
      // Only coaches can access coach routes
      return <Redirect to="/client" />;
    }
    
    if (role === "client" && userRole === "coach") {
      // Coaches cannot access client routes
      return <Redirect to="/coach" />;
    }
    // For client routes: allow undefined/null roles (new users default to client)
  }

  return <>{children}</>;
}

function ClientLayout({ children }: { children: React.ReactNode }) {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role="client" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function CoachLayout({ children }: { children: React.ReactNode }) {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role="coach" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function PublicHome() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isAuthenticated && user) {
    // Redirect based on user role
    if (user.role === "coach") {
      return <Redirect to="/coach" />;
    } else {
      return <Redirect to="/client" />;
    }
  }

  return <LandingPage />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={PublicHome} />
      <Route path="/intake" component={IntakePage} />

      {/* Client routes */}
      <Route path="/client">
        <ProtectedRoute role="client">
          <ClientLayout>
            <ClientDashboard />
          </ClientLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/client/sessions">
        <ProtectedRoute role="client">
          <ClientLayout>
            <ClientSessions />
          </ClientLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/client/sessions/:id">
        <ProtectedRoute role="client">
          <ClientLayout>
            <ClientSessionDetail />
          </ClientLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/client/actions">
        <ProtectedRoute role="client">
          <ClientLayout>
            <ClientActions />
          </ClientLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/client/resources">
        <ProtectedRoute role="client">
          <ClientLayout>
            <ClientResources />
          </ClientLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/client/profile">
        <ProtectedRoute role="client">
          <ClientLayout>
            <ClientProfile />
          </ClientLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/client/billing">
        <ProtectedRoute role="client">
          <ClientLayout>
            <ClientBilling />
          </ClientLayout>
        </ProtectedRoute>
      </Route>

      {/* Coach routes */}
      <Route path="/coach">
        <ProtectedRoute role="coach">
          <CoachLayout>
            <CoachDashboard />
          </CoachLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/coach/clients">
        <ProtectedRoute role="coach">
          <CoachLayout>
            <CoachClients />
          </CoachLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/coach/clients/:id">
        <ProtectedRoute role="coach">
          <CoachLayout>
            <CoachClientDetail />
          </CoachLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/coach/sessions">
        <ProtectedRoute role="coach">
          <CoachLayout>
            <CoachSessions />
          </CoachLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/coach/intake">
        <ProtectedRoute role="coach">
          <CoachLayout>
            <CoachIntake />
          </CoachLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/coach/resources">
        <ProtectedRoute role="coach">
          <CoachLayout>
            <CoachResources />
          </CoachLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/coach/calculator">
        <ProtectedRoute role="coach">
          <CoachLayout>
            <CoachCalculator />
          </CoachLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/coach/billing">
        <ProtectedRoute role="coach">
          <CoachLayout>
            <CoachBilling />
          </CoachLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/coach/analytics">
        <ProtectedRoute role="coach">
          <CoachLayout>
            <CoachAnalytics />
          </CoachLayout>
        </ProtectedRoute>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="holger-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
