import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { CoachSettings } from "@shared/schema";
import { Calculator, DollarSign, Clock, Percent, Save, Loader2 } from "lucide-react";

export default function CoachCalculator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<CoachSettings>({
    queryKey: ["/api/coach/settings"],
  });

  const [hourlyRate, setHourlyRate] = useState(settings?.hourlyRate || 150);
  const [sessionDuration, setSessionDuration] = useState(settings?.sessionDuration || 60);
  const [packageDiscount, setPackageDiscount] = useState(settings?.packageDiscount || 10);
  const [sessions, setSessions] = useState(4);

  const saveSettings = useMutation({
    mutationFn: async (data: { hourlyRate: number; sessionDuration: number; packageDiscount: number }) => {
      return apiRequest("PATCH", "/api/coach/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach/settings"] });
      toast({
        title: "Settings Saved",
        description: "Your pricing settings have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    },
  });

  // Calculations
  const sessionRate = (hourlyRate / 60) * sessionDuration;
  const packageTotal = sessionRate * sessions;
  const packageDiscountAmount = packageTotal * (packageDiscount / 100);
  const packageFinal = packageTotal - packageDiscountAmount;
  const perSessionWithDiscount = packageFinal / sessions;

  // Monthly projections
  const monthlyRevenue4 = sessionRate * 4;
  const monthlyRevenue8 = sessionRate * 8;
  const monthlyRevenue12 = sessionRate * 12;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Pricing Calculator</h1>
        <p className="text-muted-foreground">
          Configure your rates and calculate package pricing.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Rate Settings
            </CardTitle>
            <CardDescription>Configure your base rates and discounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hourly-rate" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Hourly Rate
                  </Label>
                  <span className="text-lg font-bold">${hourlyRate}</span>
                </div>
                <Slider
                  id="hourly-rate"
                  min={50}
                  max={500}
                  step={5}
                  value={[hourlyRate]}
                  onValueChange={(value) => setHourlyRate(value[0])}
                  data-testid="slider-hourly-rate"
                />
                <p className="text-xs text-muted-foreground">
                  Your base hourly coaching rate
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="session-duration" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Session Duration
                  </Label>
                  <span className="text-lg font-bold">{sessionDuration} min</span>
                </div>
                <Slider
                  id="session-duration"
                  min={30}
                  max={120}
                  step={15}
                  value={[sessionDuration]}
                  onValueChange={(value) => setSessionDuration(value[0])}
                  data-testid="slider-session-duration"
                />
                <p className="text-xs text-muted-foreground">
                  Default length of each session
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="package-discount" className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Package Discount
                  </Label>
                  <span className="text-lg font-bold">{packageDiscount}%</span>
                </div>
                <Slider
                  id="package-discount"
                  min={0}
                  max={30}
                  step={5}
                  value={[packageDiscount]}
                  onValueChange={(value) => setPackageDiscount(value[0])}
                  data-testid="slider-package-discount"
                />
                <p className="text-xs text-muted-foreground">
                  Discount applied to session packages
                </p>
              </div>
            </div>

            <LoadingButton
              onClick={() =>
                saveSettings.mutate({ hourlyRate, sessionDuration, packageDiscount })
              }
              loading={saveSettings.isPending}
              success={saveSettings.isSuccess}
              loadingText="Saving..."
              className="w-full"
              data-testid="button-save-settings"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </LoadingButton>
          </CardContent>
        </Card>

        {/* Calculations */}
        <div className="space-y-6">
          {/* Single Session */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Single Session Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">
                  ${sessionRate.toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  per {sessionDuration}-minute session
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Package Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Package Calculator</CardTitle>
              <CardDescription>Calculate pricing for session packages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="num-sessions">Number of Sessions</Label>
                <Input
                  id="num-sessions"
                  type="number"
                  min={2}
                  max={24}
                  value={sessions}
                  onChange={(e) => setSessions(parseInt(e.target.value) || 4)}
                  data-testid="input-sessions"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {sessions} sessions × ${sessionRate.toFixed(0)}
                  </span>
                  <span>${packageTotal.toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Package discount ({packageDiscount}%)</span>
                  <span>-${packageDiscountAmount.toFixed(0)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-bold">
                  <span>Package Total</span>
                  <span className="text-xl text-primary">${packageFinal.toFixed(0)}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  ${perSessionWithDiscount.toFixed(0)} per session (saving $
                  {(sessionRate - perSessionWithDiscount).toFixed(0)} each)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Projections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Revenue Projections</CardTitle>
              <CardDescription>Based on your current rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">${monthlyRevenue4.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">4 sessions/mo</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10">
                  <p className="text-2xl font-bold text-primary">${monthlyRevenue8.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">8 sessions/mo</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">${monthlyRevenue12.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">12 sessions/mo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
