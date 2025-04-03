import React, { createContext, useState, useContext, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  login: (userProfile: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const LOCAL_STORAGE_KEY = "cogerphere-auth";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  // Load authentication state from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedAuth) {
      try {
        const auth = JSON.parse(savedAuth);
        if (auth && auth.userProfile) {
          setIsAuthenticated(true);
          setUserProfile(auth.userProfile);
        } else {
          console.log("Valid auth object found but missing userProfile");
        }
      } catch (error) {
        console.error("Failed to parse saved auth:", error);
        // Clear invalid data
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } else {
      console.log("No saved auth found, user needs to log in");
    }
  }, []);

  const login = (profile: UserProfile) => {
    setIsAuthenticated(true);
    setUserProfile(profile);
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ userProfile: profile })
    );
    toast({
      title: "Welcome!",
      description: `You're logged in as ${profile.name}`,
    });
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserProfile(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    toast({
      title: "Logged out",
      description: "You've been successfully logged out",
    });
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, userProfile, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
