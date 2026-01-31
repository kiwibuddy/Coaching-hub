import type { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authStorage } from "./storage";
import { sendEmail, verificationEmail, passwordResetEmail } from "../lib/email";

export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/google", (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(503).json({ message: "Google sign-in is not configured" });
    }
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  });

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/?login=failed" }),
    (req, res) => {
      const user = req.user as { role?: string };
      if (user?.role === "coach") {
        res.redirect("/coach/dashboard");
      } else {
        res.redirect("/client/dashboard");
      }
    }
  );

  app.post("/api/auth/login", (req, res, next) => {
    if (req.body?.email && typeof req.body.email === "string") {
      req.body.email = req.body.email.trim().toLowerCase();
    }
    passport.authenticate("local", async (err: Error | null, user: Express.User | false) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if email is verified (for email/password users)
      const dbUser = user as { id: string; emailVerified?: boolean; googleId?: string };
      if (!dbUser.googleId && dbUser.emailVerified === false) {
        return res.status(403).json({ 
          message: "Please verify your email before logging in.",
          requiresVerification: true
        });
      }

      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json({ success: true, user });
      });
    })(req, res, next);
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      let { email, password, firstName, lastName, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      email = typeof email === "string" ? email.trim().toLowerCase() : email;
      const existing = await authStorage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }
      const hashed = await bcrypt.hash(password, 10);
      const user = await authStorage.upsertUser({
        email,
        username: email,
        password: hashed,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        role: role === "coach" ? "coach" : "client",
        emailVerified: false,
      });

      // Generate verification token and send email
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await authStorage.setVerificationToken(user.id, verificationToken, tokenExpiry);

      await sendEmail(verificationEmail(
        email,
        firstName || email.split("@")[0],
        verificationToken
      ));

      res.status(201).json({ 
        success: true, 
        requiresVerification: true,
        message: "Account created. Please check your email to verify your account."
      });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Email verification endpoint
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.redirect("/?error=invalid_token");
      }

      const user = await authStorage.getUserByVerificationToken(token);
      if (!user) {
        return res.redirect("/?error=invalid_token");
      }

      // Check if token has expired
      if (user.verificationTokenExpiry && new Date() > new Date(user.verificationTokenExpiry)) {
        return res.redirect("/?error=token_expired");
      }

      // Verify the user
      await authStorage.verifyEmail(user.id);

      // Redirect to login with success message
      res.redirect("/?verified=true");
    } catch (err) {
      console.error("Email verification error:", err);
      res.redirect("/?error=verification_failed");
    }
  });

  // Resend verification email
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await authStorage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        return res.json({ success: true, message: "If an account exists, a verification email has been sent." });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await authStorage.setVerificationToken(user.id, verificationToken, tokenExpiry);

      await sendEmail(verificationEmail(
        email,
        user.firstName || email.split("@")[0],
        verificationToken
      ));

      res.json({ success: true, message: "Verification email sent." });
    } catch (err) {
      console.error("Resend verification error:", err);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

  // Forgot password - request reset email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await authStorage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ success: true, message: "If an account exists, a password reset email has been sent." });
      }

      // Only users with password (not Google-only accounts) can reset password
      if (!user.password && user.googleId) {
        return res.json({ success: true, message: "If an account exists, a password reset email has been sent." });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await authStorage.setPasswordResetToken(user.id, resetToken, tokenExpiry);

      // Send reset email
      await sendEmail(passwordResetEmail(
        email,
        user.firstName || email.split("@")[0],
        resetToken
      ));

      res.json({ success: true, message: "If an account exists, a password reset email has been sent." });
    } catch (err) {
      console.error("Forgot password error:", err);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const user = await authStorage.getUserByPasswordResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Check if token has expired
      if (user.passwordResetExpiry && new Date() > new Date(user.passwordResetExpiry)) {
        return res.status(400).json({ message: "Reset token has expired. Please request a new one." });
      }

      // Hash and save new password
      const hashedPassword = await bcrypt.hash(password, 10);
      await authStorage.resetPassword(user.id, hashedPassword);

      res.json({ success: true, message: "Password has been reset successfully. You can now log in." });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  const logout = (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      if (req.xhr || req.headers.accept?.includes("application/json")) {
        res.json({ success: true });
      } else {
        res.redirect("/");
      }
    });
  };
  app.post("/api/auth/logout", logout);
  app.get("/api/logout", logout);

  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as { id: string };
      const dbUser = await authStorage.getUser(user.id);
      res.json(dbUser ?? req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.patch("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as { id: string };
      const { firstName, lastName, timezone, onboardingCompleted, colorTheme } = req.body;

      const updates: { firstName?: string; lastName?: string; timezone?: string; onboardingCompleted?: boolean; colorTheme?: string } = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (timezone !== undefined) updates.timezone = timezone;
      if (onboardingCompleted !== undefined) updates.onboardingCompleted = onboardingCompleted;
      if (colorTheme !== undefined) updates.colorTheme = colorTheme;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const updatedUser = await authStorage.upsertUser({
        id: user.id,
        ...updates,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Set password for users who signed up through intake (no password yet)
  app.post("/api/auth/set-password", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as { id: string };
      const { password } = req.body;

      if (!password || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const dbUser = await authStorage.getUser(user.id);
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow setting password if user doesn't have one yet
      if (dbUser.password) {
        return res.status(400).json({ message: "Password already set. Use forgot password to reset." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await authStorage.upsertUser({
        id: user.id,
        password: hashedPassword,
        emailVerified: true, // Mark as verified since they came through intake
      });

      res.json({ success: true, message: "Password set successfully" });
    } catch (error) {
      console.error("Error setting password:", error);
      res.status(500).json({ message: "Failed to set password" });
    }
  });
}
