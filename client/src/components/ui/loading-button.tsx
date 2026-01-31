"use client";

import * as React from "react";
import { Loader2, Check } from "lucide-react";
import { Button, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";

export interface LoadingButtonProps extends ButtonProps {
  /** Shows a loading spinner and disables the button */
  loading?: boolean;
  /** Shows a success checkmark briefly (auto-resets after 1.5s) */
  success?: boolean;
  /** Shows shake animation for errors */
  error?: boolean;
  /** Text to show while loading (optional) */
  loadingText?: string;
  /** Duration to show success state in ms (default: 1500) */
  successDuration?: number;
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      loading = false,
      success = false,
      error = false,
      loadingText,
      successDuration = 1500,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [showError, setShowError] = React.useState(false);

    // Handle success state with auto-reset
    React.useEffect(() => {
      if (success) {
        setShowSuccess(true);
        const timer = setTimeout(() => {
          setShowSuccess(false);
        }, successDuration);
        return () => clearTimeout(timer);
      }
    }, [success, successDuration]);

    // Handle error state with auto-reset
    React.useEffect(() => {
      if (error) {
        setShowError(true);
        const timer = setTimeout(() => {
          setShowError(false);
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [error]);

    const isDisabled = disabled || loading;

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          showSuccess && "bg-green-600 border-green-700 hover:bg-green-600",
          showError && "animate-shake",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : showSuccess ? (
          <>
            <Check className="h-4 w-4" />
            {children}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
