import { Resend } from "resend";

// Only create Resend client when API key is set (constructor throws otherwise)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY not set. Email functionality will be disabled.");
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!resend || !process.env.RESEND_API_KEY) {
    console.warn("Email not sent - RESEND_API_KEY not configured:", options.subject);
    return false;
  }

  try {
    await resend.emails.send({
      from: options.from || process.env.RESEND_FROM_EMAIL || "Holger Coaching <noreply@holgercoaching.com>",
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

// Email Templates

export function intakeSubmittedEmail(coachEmail: string, intakeData: {
  firstName: string;
  lastName: string;
  email: string;
  goals: string;
}): EmailOptions {
  return {
    to: coachEmail,
    subject: "New Coaching Intake Form Submitted",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3A5A6D; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #3A5A6D; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3A5A6D; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Intake Form Submission</h1>
            </div>
            <div class="content">
              <p>A new coaching intake form has been submitted:</p>
              <div class="info-row"><span class="label">Name:</span> ${intakeData.firstName} ${intakeData.lastName}</div>
              <div class="info-row"><span class="label">Email:</span> ${intakeData.email}</div>
              <div class="info-row"><span class="label">Goals:</span> ${intakeData.goals}</div>
              <p>Please review the intake form in your coaching dashboard.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function accountCreatedEmail(clientEmail: string, clientName: string): EmailOptions {
  return {
    to: clientEmail,
    subject: "Welcome to Holger Coaching Portal - Your Account is Ready!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3A5A6D; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3A5A6D; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .email-box { background-color: #e8f4f8; padding: 12px 16px; border-radius: 6px; font-family: monospace; font-size: 14px; margin: 10px 0; }
            .step { display: flex; align-items: flex-start; margin: 10px 0; }
            .step-number { background-color: #3A5A6D; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Holger Coaching!</h1>
            </div>
            <div class="content">
              <p>Hi ${clientName},</p>
              <p>Great news! Your coaching application has been accepted. Your account is now ready.</p>
              
              <h3>How to Access Your Portal:</h3>
              <div class="step">
                <span class="step-number">1</span>
                <span>Click the button below to go to the portal</span>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <span>Click <strong>"Sign in with Google"</strong></span>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <span>Use your Google account with this email address:</span>
              </div>
              <div class="email-box">${clientEmail}</div>
              
              <p>Once signed in, you can:</p>
              <ul>
                <li>View and manage your coaching sessions</li>
                <li>Access resources and materials</li>
                <li>Track your action items and progress</li>
                <li>Communicate with your coach</li>
              </ul>
              
              <a href="${process.env.APP_URL || "https://your-app-url.com"}" class="button">Access Your Portal</a>
              
              <p style="margin-top: 20px; font-size: 13px; color: #666;">
                <strong>Note:</strong> Make sure to sign in with your Google account that uses ${clientEmail}. 
                If you don't have a Google account with this email, please contact your coach.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function sessionScheduledEmail(
  recipientEmail: string,
  recipientName: string,
  sessionData: {
    title: string;
    scheduledAt: string;
    duration: number;
    meetingLink?: string;
  },
  isClient: boolean
): EmailOptions {
  const role = isClient ? "Your coach" : "Your client";
  const action = isClient ? "confirm" : "review";
  
  return {
    to: recipientEmail,
    subject: isClient 
      ? `New Session Scheduled: ${sessionData.title}`
      : `Session Request: ${sessionData.title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3A5A6D; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .session-info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .info-row { margin: 8px 0; }
            .label { font-weight: bold; color: #3A5A6D; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3A5A6D; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isClient ? "New Session Scheduled" : "Session Request"}</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName},</p>
              <p>${role} has ${isClient ? "scheduled" : "requested"} a coaching session:</p>
              <div class="session-info">
                <div class="info-row"><span class="label">Title:</span> ${sessionData.title}</div>
                <div class="info-row"><span class="label">Date & Time:</span> ${new Date(sessionData.scheduledAt).toLocaleString()}</div>
                <div class="info-row"><span class="label">Duration:</span> ${sessionData.duration} minutes</div>
                ${sessionData.meetingLink ? `<div class="info-row"><span class="label">Meeting Link:</span> <a href="${sessionData.meetingLink}">${sessionData.meetingLink}</a></div>` : ""}
              </div>
              <p>Please ${action} this session in your coaching portal.</p>
              <a href="${process.env.APP_URL || "https://your-app-url.com"}" class="button">View Session</a>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function sessionReminderEmail(
  recipientEmail: string,
  recipientName: string,
  sessionData: {
    title: string;
    scheduledAt: string;
    duration: number;
    meetingLink?: string;
  }
): EmailOptions {
  return {
    to: recipientEmail,
    subject: `Reminder: Coaching Session Tomorrow - ${sessionData.title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3A5A6D; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .session-info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .info-row { margin: 8px 0; }
            .label { font-weight: bold; color: #3A5A6D; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3A5A6D; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Session Reminder</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName},</p>
              <p>This is a reminder that you have a coaching session scheduled for tomorrow:</p>
              <div class="session-info">
                <div class="info-row"><span class="label">Title:</span> ${sessionData.title}</div>
                <div class="info-row"><span class="label">Date & Time:</span> ${new Date(sessionData.scheduledAt).toLocaleString()}</div>
                <div class="info-row"><span class="label">Duration:</span> ${sessionData.duration} minutes</div>
                ${sessionData.meetingLink ? `<div class="info-row"><span class="label">Meeting Link:</span> <a href="${sessionData.meetingLink}">${sessionData.meetingLink}</a></div>` : ""}
              </div>
              <p>We look forward to seeing you!</p>
              <a href="${process.env.APP_URL || "https://your-app-url.com"}" class="button">View Session Details</a>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function resourceUploadedEmail(
  clientEmail: string,
  clientName: string,
  resourceData: {
    title: string;
    description?: string;
  }
): EmailOptions {
  return {
    to: clientEmail,
    subject: `New Resource Available: ${resourceData.title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3A5A6D; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .resource-info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3A5A6D; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Resource Available</h1>
            </div>
            <div class="content">
              <p>Hi ${clientName},</p>
              <p>Your coach has shared a new resource with you:</p>
              <div class="resource-info">
                <h3>${resourceData.title}</h3>
                ${resourceData.description ? `<p>${resourceData.description}</p>` : ""}
              </div>
              <p>You can access this resource in your coaching portal.</p>
              <a href="${process.env.APP_URL || "https://your-app-url.com"}/client/resources" class="button">View Resources</a>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function actionItemAssignedEmail(
  clientEmail: string,
  clientName: string,
  actionData: {
    title: string;
    description?: string;
    dueDate?: string;
  }
): EmailOptions {
  return {
    to: clientEmail,
    subject: `New Action Item: ${actionData.title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3A5A6D; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .action-info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .info-row { margin: 8px 0; }
            .label { font-weight: bold; color: #3A5A6D; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3A5A6D; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Action Item Assigned</h1>
            </div>
            <div class="content">
              <p>Hi ${clientName},</p>
              <p>Your coach has assigned you a new action item:</p>
              <div class="action-info">
                <div class="info-row"><span class="label">Task:</span> ${actionData.title}</div>
                ${actionData.description ? `<div class="info-row"><span class="label">Details:</span> ${actionData.description}</div>` : ""}
                ${actionData.dueDate ? `<div class="info-row"><span class="label">Due Date:</span> ${new Date(actionData.dueDate).toLocaleDateString()}</div>` : ""}
              </div>
              <p>Please review and complete this action item.</p>
              <a href="${process.env.APP_URL || "https://your-app-url.com"}/client/actions" class="button">View Action Items</a>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function actionItemDueEmail(
  clientEmail: string,
  clientName: string,
  actionData: {
    title: string;
    dueDate: string;
  }
): EmailOptions {
  return {
    to: clientEmail,
    subject: `Action Item Due Tomorrow: ${actionData.title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #D97706; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .action-info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #D97706; }
            .button { display: inline-block; padding: 12px 24px; background-color: #D97706; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Action Item Due Tomorrow</h1>
            </div>
            <div class="content">
              <p>Hi ${clientName},</p>
              <p>This is a reminder that the following action item is due tomorrow:</p>
              <div class="action-info">
                <strong>${actionData.title}</strong>
                <p>Due: ${new Date(actionData.dueDate).toLocaleDateString()}</p>
              </div>
              <p>Please ensure you complete this action item on time.</p>
              <a href="${process.env.APP_URL || "https://your-app-url.com"}/client/actions" class="button">View Action Items</a>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function sessionCancelledEmail(
  recipientEmail: string,
  recipientName: string,
  sessionData: {
    title: string;
    scheduledAt: string;
    cancelledBy: string;
  }
): EmailOptions {
  return {
    to: recipientEmail,
    subject: `Session Cancelled: ${sessionData.title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #DC2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .session-info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #DC2626; }
            .info-row { margin: 8px 0; }
            .label { font-weight: bold; color: #DC2626; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3A5A6D; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Session Cancelled</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName},</p>
              <p>The following coaching session has been cancelled:</p>
              <div class="session-info">
                <div class="info-row"><span class="label">Title:</span> ${sessionData.title}</div>
                <div class="info-row"><span class="label">Scheduled for:</span> ${new Date(sessionData.scheduledAt).toLocaleString()}</div>
                <div class="info-row"><span class="label">Cancelled by:</span> ${sessionData.cancelledBy}</div>
              </div>
              <p>If you have any questions, please reach out to reschedule.</p>
              <a href="${process.env.APP_URL || "https://your-app-url.com"}" class="button">View Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function paymentReceivedEmail(
  recipientEmail: string,
  recipientName: string,
  paymentData: {
    amount: string;
    description: string;
    date: string;
  },
  isCoach: boolean = false
): EmailOptions {
  const subject = isCoach 
    ? `Payment Received: ${paymentData.amount}` 
    : `Payment Confirmation: ${paymentData.amount}`;
  
  const message = isCoach
    ? "You've received a new payment from a client:"
    : "Thank you for your payment. Here are your payment details:";

  return {
    to: recipientEmail,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .payment-info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #059669; }
            .amount { font-size: 24px; font-weight: bold; color: #059669; }
            .info-row { margin: 8px 0; }
            .label { font-weight: bold; color: #3A5A6D; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3A5A6D; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isCoach ? "Payment Received" : "Payment Confirmation"}</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName},</p>
              <p>${message}</p>
              <div class="payment-info">
                <div class="amount">${paymentData.amount}</div>
                <div class="info-row"><span class="label">Description:</span> ${paymentData.description}</div>
                <div class="info-row"><span class="label">Date:</span> ${paymentData.date}</div>
              </div>
              <p>${isCoach ? "The payment has been processed and will be deposited to your account." : "Thank you for your business!"}</p>
              <a href="${process.env.APP_URL || "https://your-app-url.com"}/${isCoach ? "coach" : "client"}/billing" class="button">View Billing</a>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
