import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { applyColorTheme, type ColorTheme } from "@/components/theme-selector";

interface UserData {
  colorTheme?: ColorTheme | null;
}

interface CoachSettings {
  colorTheme?: ColorTheme | null;
}

/**
 * Hook that automatically applies the user's color theme preference.
 * - For coaches: uses their own colorTheme from user record
 * - For clients: uses their colorTheme if set, otherwise falls back to coach's default
 */
export function useColorTheme() {
  const { user, isAuthenticated } = useAuth();
  const isCoach = user?.role === "coach";

  // Fetch user data (which includes colorTheme)
  const { data: userData } = useQuery<UserData>({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
  });

  // Fetch coach settings (for coach's default theme)
  const { data: coachSettings } = useQuery<CoachSettings>({
    queryKey: ["/api/coach/settings"],
    enabled: isAuthenticated && isCoach,
  });

  // Determine which theme to use
  const effectiveTheme: ColorTheme | null = (() => {
    // User's personal preference takes precedence
    if (userData?.colorTheme) {
      return userData.colorTheme;
    }
    // For coaches, fall back to their coach settings theme
    if (isCoach && coachSettings?.colorTheme) {
      return coachSettings.colorTheme;
    }
    // Default to ember
    return null;
  })();

  // Apply the theme to the document
  useEffect(() => {
    applyColorTheme(effectiveTheme);
  }, [effectiveTheme]);

  return {
    colorTheme: effectiveTheme || "ember",
    isLoading: !userData,
  };
}
