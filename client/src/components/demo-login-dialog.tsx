import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Mail, CheckCircle } from "lucide-react";

interface LoginDialogProps {
  trigger?: React.ReactNode;
}

export function DemoLoginDialog({ trigger }: LoginDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"client" | "coach">("client");
  const [verificationSent, setVerificationSent] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return apiRequest<{ success: boolean; user: { id: string; firstName?: string; role?: string }; requiresVerification?: boolean; message?: string }>("POST", "/api/auth/login", data);
    },
    onSuccess: (data) => {
      if (data.success && data.user) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Login Successful",
          description: `Welcome back${data.user.firstName ? `, ${data.user.firstName}` : ""}!`,
        });
        setOpen(false);
        if (data.user.role === "coach") {
          navigate("/coach");
        } else {
          navigate("/client");
        }
      }
    },
    onError: (err: Error & { response?: { status?: number }; message?: string }) => {
      // Check if it's a verification error
      if (err.message?.includes("verify your email")) {
        setUnverifiedEmail(email);
        toast({
          title: "Email Not Verified",
          description: "Please check your email and click the verification link.",
          variant: "destructive",
        });
      } else {
        const message = err.response?.status === 401 ? "Invalid email or password." : "Login failed. Please try again.";
        toast({
          title: "Login Failed",
          description: message,
          variant: "destructive",
        });
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: string;
    }) => {
      return apiRequest<{ success: boolean; requiresVerification?: boolean; message?: string }>("POST", "/api/auth/register", data);
    },
    onSuccess: (data) => {
      if (data.requiresVerification) {
        setVerificationSent(true);
        toast({
          title: "Check Your Email",
          description: "We've sent you a verification link. Please check your inbox.",
        });
      }
    },
    onError: (err: Error & { message?: string }) => {
      const msg = typeof err.message === "string" && err.message.includes("already exists")
        ? "An account with this email already exists."
        : "Registration failed. Please try again.";
      toast({
        title: "Registration Failed",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (emailToResend: string) => {
      return apiRequest<{ success: boolean; message: string }>("POST", "/api/auth/resend-verification", { email: emailToResend });
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Verification email has been resent. Please check your inbox.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUnverifiedEmail(null);
    if (email && password) {
      loginMutation.mutate({ email, password });
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerEmail && registerPassword) {
      registerMutation.mutate({
        email: registerEmail,
        password: registerPassword,
        firstName,
        lastName,
        role,
      });
    }
  };

  const resetForm = () => {
    setVerificationSent(false);
    setUnverifiedEmail(null);
    setRegisterEmail("");
    setRegisterPassword("");
    setFirstName("");
    setLastName("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" data-testid="button-login">
            Sign In
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Sign in with Google or use your email and password.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin" data-testid="tab-signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup" data-testid="tab-signup">Sign up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-4">
            <a href="/api/auth/google" className="block">
              <Button type="button" variant="outline" className="w-full" data-testid="button-google-auth">
                Continue with Google
              </Button>
            </a>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    data-testid="input-email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    data-testid="input-password"
                  />
                </div>
              </div>

              {/* Show resend verification option if email not verified */}
              {unverifiedEmail && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-sm">
                  <p className="text-amber-800 dark:text-amber-200 mb-2">
                    Your email is not verified. Please check your inbox.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => resendMutation.mutate(unverifiedEmail)}
                    disabled={resendMutation.isPending}
                  >
                    {resendMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend verification email"
                    )}
                  </Button>
                </div>
              )}

              <LoadingButton
                type="submit"
                className="w-full"
                loading={loginMutation.isPending}
                loadingText="Signing in..."
                disabled={!email || !password}
                data-testid="button-submit-login"
              >
                Sign In
              </LoadingButton>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-4">
            {verificationSent ? (
              /* Verification email sent state */
              <div className="text-center py-6">
                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Check your email</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  We've sent a verification link to <strong>{registerEmail}</strong>. 
                  Click the link to verify your account.
                </p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => resendMutation.mutate(registerEmail)}
                    disabled={resendMutation.isPending}
                    className="w-full"
                  >
                    {resendMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend verification email"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={resetForm}
                    className="w-full"
                  >
                    Back to sign up
                  </Button>
                </div>
              </div>
            ) : (
              /* Registration form */
              <>
                <a href="/api/auth/google" className="block">
                  <Button type="button" variant="outline" className="w-full" data-testid="button-google-signup">
                    Sign up with Google
                  </Button>
                </a>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or sign up with email</span>
                  </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerEmail">Email</Label>
                    <Input
                      id="registerEmail"
                      type="email"
                      placeholder="you@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      data-testid="input-register-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerPassword">Password</Label>
                    <Input
                      id="registerPassword"
                      type="password"
                      placeholder="Choose a password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      data-testid="input-register-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>I am a</Label>
                    <Select value={role} onValueChange={(v: "client" | "coach") => setRole(v)}>
                      <SelectTrigger data-testid="select-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending || !registerEmail || !registerPassword}
                    data-testid="button-submit-register"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </form>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
