import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Phone, MapPin, Clock, CheckCircle, ArrowRight, ArrowLeft, Palette } from "lucide-react";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { TimezoneSelector } from "@/components/timezone-selector";
import { ThemeSelector, applyColorTheme, type ColorTheme } from "@/components/theme-selector";

interface CoachSettings {
  id?: string;
  businessName?: string;
  bio?: string;
  location?: string;
  countryCode?: string;
  phone?: string;
  hourlyRate?: number;
  sessionDuration?: number;
  onboardingCompleted?: boolean;
  colorTheme?: ColorTheme | null;
}

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
}

export default function CoachSetup() {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState<string | undefined>("");
  const [timezone, setTimezone] = useState("");
  const [hourlyRate, setHourlyRate] = useState("150");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user data
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: () => apiRequest("GET", "/api/auth/user"),
  });

  // Get existing coach settings
  const { data: settings, isLoading: settingsLoading } = useQuery<CoachSettings>({
    queryKey: ["/api/coach/settings"],
    queryFn: () => apiRequest("GET", "/api/coach/settings"),
    retry: false,
  });

  // Pre-populate with existing data
  useEffect(() => {
    if (settings) {
      if (settings.businessName) setBusinessName(settings.businessName);
      if (settings.bio) setBio(settings.bio);
      if (settings.location) setLocation(settings.location);
      if (settings.phone) {
        // Combine country code and phone if they exist
        const fullPhone = settings.countryCode && settings.phone 
          ? `${settings.countryCode}${settings.phone}`
          : settings.phone;
        setPhone(fullPhone);
      }
      if (settings.hourlyRate) setHourlyRate(settings.hourlyRate.toString());
      if (settings.colorTheme) applyColorTheme(settings.colorTheme);
    }

    // Auto-detect timezone
    if (user?.timezone) {
      setTimezone(user.timezone);
    } else if (!timezone) {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(browserTimezone);
    }
  }, [settings, user]);

  // Allow coaches to open /coach/setup anytime as "Settings" (no redirect when onboarding already completed)

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<CoachSettings> & { timezone?: string }) => {
      // Update user timezone if changed
      if (data.timezone && data.timezone !== user?.timezone) {
        await apiRequest("PATCH", "/api/auth/user", { timezone: data.timezone });
      }
      // Update coach settings
      return apiRequest("PATCH", "/api/coach/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const themeMutation = useMutation({
    mutationFn: async (colorTheme: ColorTheme) => {
      applyColorTheme(colorTheme);
      return apiRequest("PATCH", "/api/coach/settings", { colorTheme });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach/settings"] });
      toast({ title: "Theme updated", description: "Your portal theme has been saved." });
    },
    onError: () => {
      toast({ title: "Failed to save theme", variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      // Parse phone number into country code and number
      let countryCode = "";
      let phoneNumber = phone || "";
      
      if (phone && phone.startsWith("+")) {
        // Extract country code (assume first 1-4 digits after +)
        const match = phone.match(/^\+(\d{1,4})/);
        if (match) {
          countryCode = "+" + match[1];
          phoneNumber = phone.slice(countryCode.length);
        }
      }

      const data = {
        businessName,
        bio,
        location,
        countryCode,
        phone: phoneNumber,
        hourlyRate: parseInt(hourlyRate),
        onboardingCompleted: true,
      };

      // Update timezone
      if (timezone && timezone !== user?.timezone) {
        await apiRequest("PATCH", "/api/auth/user", { timezone });
      }

      return apiRequest("PATCH", "/api/coach/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Setup Complete!",
        description: "Your profile is ready. Let's start coaching!",
      });
      navigate("/coach");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s < step
                    ? "bg-primary text-primary-foreground"
                    : s === step
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 mx-1 rounded ${
                    s < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {step === 1 && "Welcome! Let's set up your profile"}
              {step === 2 && "Contact Information"}
              {step === 3 && "Time & Rates"}
              {step === 4 && "You're all set!"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us about your coaching practice"}
              {step === 2 && "How can clients reach you?"}
              {step === 3 && "Set your timezone and default rates"}
              {step === 4 && "Review your setup and get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Business Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">
                    <Building2 className="inline h-4 w-4 mr-1" />
                    Business Name (optional)
                  </Label>
                  <Input
                    id="businessName"
                    placeholder="e.g., Mindful Leadership Coaching"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">About You / Your Practice</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell clients about your coaching approach, experience, and what makes you unique..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be visible to clients on your profile
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Contact Info */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., New York, NY, USA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Phone Number
                  </Label>
                  <div className="phone-input-container">
                    <PhoneInput
                      international
                      countryCallingCodeEditable={false}
                      defaultCountry="US"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={setPhone}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select your country code from the dropdown
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Timezone & Rates */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    <Clock className="inline h-4 w-4 mr-1" />
                    Your Timezone
                  </Label>
                  <TimezoneSelector value={timezone} onChange={setTimezone} />
                  <p className="text-xs text-muted-foreground">
                    Search by city name. Sessions will display in this timezone by default.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Default Hourly Rate (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="hourlyRate"
                      type="number"
                      min="0"
                      placeholder="150"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can customize this for individual clients
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Summary */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  {businessName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Business</span>
                      <span className="font-medium">{businessName}</span>
                    </div>
                  )}
                  {location && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{location}</span>
                    </div>
                  )}
                  {phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timezone</span>
                    <span className="font-medium">{timezone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hourly Rate</span>
                    <span className="font-medium">${hourlyRate}/hour</span>
                  </div>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  You can update these settings anytime from your profile.
                </p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6">
              {step > 1 ? (
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              
              {step < 4 ? (
                <Button onClick={nextStep}>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => completeMutation.mutate()}
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Get Started
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skip option */}
        <div className="text-center mt-4">
          <Button
            variant="link"
            className="text-muted-foreground"
            onClick={() => {
              saveMutation.mutate({ onboardingCompleted: true });
              navigate("/coach");
            }}
          >
            Skip for now
          </Button>
        </div>

        {/* Color theme – always visible on Settings */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Color theme
            </CardTitle>
            <CardDescription>
              Choose how your portal looks. This applies to your coach view; clients can set their own theme in Profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSelector
              value={(settings?.colorTheme as ColorTheme) ?? undefined}
              onChange={(theme) => themeMutation.mutate(theme)}
              disabled={themeMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>

      {/* Custom styles for phone input */}
      <style>{`
        .PhoneInput {
          display: flex;
          align-items: center;
        }
        .PhoneInputCountry {
          margin-right: 0.5rem;
        }
        .PhoneInputInput {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.875rem;
        }
        .PhoneInputCountrySelect {
          background: transparent;
          border: none;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}
