import { createContext, useContext, ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetCurrentUser, useLogout, CurrentUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: CurrentUser | null;
  isLoading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: user, isLoading, error } = useGetCurrentUser({
    query: {
      retry: false,
      staleTime: 5 * 60 * 1000,
    }
  });

  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setLocation("/login");
    } catch (err) {
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        logout: handleLogout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
