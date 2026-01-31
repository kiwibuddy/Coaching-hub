"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type ColorTheme = "ember" | "ocean" | "forest" | "twilight" | "slate" | "rose";

interface ThemeOption {
  id: ColorTheme;
  name: string;
  description: string;
  previewColor: string;
  darkPreviewColor: string;
}

export const COLOR_THEMES: ThemeOption[] = [
  {
    id: "ember",
    name: "Ember",
    description: "Warm & professional",
    previewColor: "#D97706",
    darkPreviewColor: "#F59E0B",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Calm & trustworthy",
    previewColor: "#0891B2",
    darkPreviewColor: "#22D3EE",
  },
  {
    id: "forest",
    name: "Forest",
    description: "Growth-oriented",
    previewColor: "#059669",
    darkPreviewColor: "#34D399",
  },
  {
    id: "twilight",
    name: "Twilight",
    description: "Creative & premium",
    previewColor: "#7C3AED",
    darkPreviewColor: "#A78BFA",
  },
  {
    id: "slate",
    name: "Slate",
    description: "Minimal & corporate",
    previewColor: "#475569",
    darkPreviewColor: "#94A3B8",
  },
  {
    id: "rose",
    name: "Rose",
    description: "Modern & warm",
    previewColor: "#E11D48",
    darkPreviewColor: "#FB7185",
  },
];

interface ThemeSelectorProps {
  value: ColorTheme | null | undefined;
  onChange: (theme: ColorTheme) => void;
  disabled?: boolean;
  className?: string;
}

export function ThemeSelector({ value, onChange, disabled, className }: ThemeSelectorProps) {
  const selectedTheme = value || "ember";

  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      {COLOR_THEMES.map((theme) => {
        const isSelected = selectedTheme === theme.id;
        
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            disabled={disabled}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
              "hover:border-primary/50 hover:bg-muted/50",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              isSelected 
                ? "border-primary bg-primary/5 ring-1 ring-primary" 
                : "border-border bg-background",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Color preview circle */}
            <div 
              className="w-10 h-10 rounded-full shadow-sm ring-1 ring-black/10 dark:ring-white/10"
              style={{ 
                background: `linear-gradient(135deg, ${theme.previewColor} 50%, ${theme.darkPreviewColor} 50%)` 
              }}
            />
            
            {/* Theme name */}
            <div className="text-center">
              <p className="text-sm font-medium">{theme.name}</p>
              <p className="text-xs text-muted-foreground">{theme.description}</p>
            </div>
            
            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Apply a color theme to the document.
 * Call this when user selects a theme or on initial load.
 */
export function applyColorTheme(theme: ColorTheme | null | undefined) {
  const themeToApply = theme || "ember";
  
  if (themeToApply === "ember") {
    // Remove data-theme attribute for default theme
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", themeToApply);
  }
}
