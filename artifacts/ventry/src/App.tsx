import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

// Pages
import Login from "@/pages/auth/login";
import SuperAdminDashboard from "@/pages/super-admin/dashboard";
import PortalDashboard from "@/pages/portal/dashboard";
import VisitRequests from "@/pages/portal/visit-requests";
import ReceptionistDashboard from "@/pages/receptionist/dashboard";
import PublicBooking from "@/pages/public/booking";
import TelegramSettings from "@/pages/settings/telegram";

const queryClient = new QueryClient();

// Protected Route Wrapper
function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="p-8 text-center text-red-600">Access Denied</div>;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function getRoleHome(role: string) {
  if (role === 'super_admin') return '/super-admin/dashboard';
  if (role === 'receptionist') return '/receptionist';
  if (role === 'host_employee') return '/portal/visit-requests';
  return '/portal/dashboard';
}

// Redirect root based on role
function RootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Redirect to="/login" />;
  return <Redirect to={getRoleHome(user.role)} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={Login} />
      
      {/* Public Routes */}
      <Route path="/public/orgs/:slug" component={PublicBooking} />
      
      {/* Super Admin Routes */}
      <Route path="/super-admin/dashboard">
        {() => <ProtectedRoute component={SuperAdminDashboard} allowedRoles={['super_admin']} />}
      </Route>
      
      {/* Portal Routes (Org Admin / Visitor Manager) */}
      <Route path="/portal/dashboard">
        {() => <ProtectedRoute component={PortalDashboard} allowedRoles={['org_admin', 'visitor_manager']} />}
      </Route>
      <Route path="/portal/visit-requests">
        {() => <ProtectedRoute component={VisitRequests} allowedRoles={['org_admin', 'visitor_manager', 'receptionist', 'host_employee']} />}
      </Route>

      {/* Receptionist Route */}
      <Route path="/receptionist">
        {() => <ProtectedRoute component={ReceptionistDashboard} allowedRoles={['receptionist']} />}
      </Route>

      {/* Settings */}
      <Route path="/settings/telegram">
        {() => <ProtectedRoute component={TelegramSettings} />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
