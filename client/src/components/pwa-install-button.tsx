import { usePWAInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";
import { Download, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PWAInstallButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showOfflineIndicator?: boolean;
}

export function PWAInstallButton({
  variant = "outline",
  size = "sm",
  showOfflineIndicator = true,
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isOnline, promptInstall } = usePWAInstall();
  const { toast } = useToast();

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      toast({
        title: "App Installed",
        description: "Holger Coaching has been added to your home screen.",
      });
    }
  };

  // If already installed, show nothing or just online status
  if (isInstalled) {
    if (showOfflineIndicator && !isOnline) {
      return (
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 px-2">
          <WifiOff className="h-4 w-4" />
          <span>Offline</span>
        </div>
      );
    }
    return null;
  }

  // Show install button if installable
  if (isInstallable) {
    return (
      <Button variant={variant} size={size} onClick={handleInstall}>
        <Download className="h-4 w-4 mr-2" />
        Install App
      </Button>
    );
  }

  // Show offline indicator when not installable
  if (showOfflineIndicator && !isOnline) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 px-2">
        <WifiOff className="h-4 w-4" />
        <span>Offline</span>
      </div>
    );
  }

  return null;
}

// Compact version for sidebar
export function PWAInstallBanner() {
  const { isInstallable, promptInstall } = usePWAInstall();
  const { toast } = useToast();

  if (!isInstallable) return null;

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      toast({
        title: "App Installed",
        description: "Holger Coaching has been added to your home screen.",
      });
    }
  };

  return (
    <div className="mx-4 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
      <div className="flex items-center gap-3">
        <Download className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Install App</p>
          <p className="text-xs text-muted-foreground truncate">
            Add to home screen for quick access
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-2"
        onClick={handleInstall}
      >
        Install Now
      </Button>
    </div>
  );
}
