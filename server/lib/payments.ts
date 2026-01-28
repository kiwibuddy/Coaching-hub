import Stripe from "stripe";
import { db } from "../db";
import { payments, invoices, type Payment, type InsertPayment, type Invoice, type InsertInvoice } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

// Initialize Stripe (only if API key is set)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY not set. Stripe payments will be disabled.");
}

// PayPal configuration
const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string | null> {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    console.warn("PayPal credentials not set. PayPal payments will be disabled.");
    return null;
  }

  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// ============================================================
// STRIPE FUNCTIONS
// ============================================================

export async function createStripeCheckoutSession(options: {
  clientId: string;
  amount: number; // in cents
  currency?: string;
  description: string;
  sessionId?: string;
  invoiceId?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string } | null> {
  if (!stripe) return null;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: options.currency || "usd",
          product_data: {
            name: options.description,
          },
          unit_amount: options.amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: {
      clientId: options.clientId,
      sessionId: options.sessionId || "",
      invoiceId: options.invoiceId || "",
    },
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

export async function handleStripeWebhook(
  payload: Buffer,
  signature: string
): Promise<{ success: boolean; paymentId?: string }> {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return { success: false };
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Create payment record
      const [payment] = await db.insert(payments).values({
        clientId: session.metadata?.clientId || "",
        sessionId: session.metadata?.sessionId || null,
        invoiceId: session.metadata?.invoiceId || null,
        amount: session.amount_total || 0,
        currency: session.currency || "usd",
        status: "completed",
        provider: "stripe",
        providerPaymentId: session.payment_intent as string,
        providerCustomerId: session.customer as string,
        description: `Payment for ${session.metadata?.sessionId ? "session" : "invoice"}`,
        paidAt: new Date(),
      }).returning();

      // Update invoice if applicable
      if (session.metadata?.invoiceId) {
        await db.update(invoices)
          .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
          .where(eq(invoices.id, session.metadata.invoiceId));
      }

      return { success: true, paymentId: payment.id };
    }

    return { success: true };
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return { success: false };
  }
}

// ============================================================
// PAYPAL FUNCTIONS
// ============================================================

export async function createPayPalOrder(options: {
  clientId: string;
  amount: number; // in cents
  currency?: string;
  description: string;
  sessionId?: string;
  invoiceId?: string;
}): Promise<{ orderId: string; approvalUrl: string } | null> {
  const accessToken = await getPayPalAccessToken();
  if (!accessToken) return null;

  const amountInDollars = (options.amount / 100).toFixed(2);

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: options.currency?.toUpperCase() || "USD",
            value: amountInDollars,
          },
          description: options.description,
          custom_id: JSON.stringify({
            clientId: options.clientId,
            sessionId: options.sessionId,
            invoiceId: options.invoiceId,
          }),
        },
      ],
      application_context: {
        return_url: `${process.env.APP_URL}/api/payments/paypal/capture`,
        cancel_url: `${process.env.APP_URL}/client/billing?cancelled=true`,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal order creation failed:", error);
    return null;
  }

  const order = await response.json();
  const approvalUrl = order.links.find((l: { rel: string }) => l.rel === "approve")?.href;

  return {
    orderId: order.id,
    approvalUrl,
  };
}

export async function capturePayPalOrder(orderId: string): Promise<{ success: boolean; paymentId?: string }> {
  const accessToken = await getPayPalAccessToken();
  if (!accessToken) return { success: false };

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal capture failed:", error);
    return { success: false };
  }

  const capture = await response.json();
  const purchaseUnit = capture.purchase_units[0];
  const captureData = purchaseUnit.payments.captures[0];
  
  // Parse custom_id to get metadata
  let metadata: { clientId: string; sessionId?: string; invoiceId?: string } = { clientId: "" };
  try {
    metadata = JSON.parse(purchaseUnit.custom_id || "{}");
  } catch {}

  // Create payment record
  const [payment] = await db.insert(payments).values({
    clientId: metadata.clientId,
    sessionId: metadata.sessionId || null,
    invoiceId: metadata.invoiceId || null,
    amount: Math.round(parseFloat(captureData.amount.value) * 100),
    currency: captureData.amount.currency_code.toLowerCase(),
    status: "completed",
    provider: "paypal",
    providerPaymentId: orderId,
    description: `PayPal payment`,
    paidAt: new Date(),
  }).returning();

  // Update invoice if applicable
  if (metadata.invoiceId) {
    await db.update(invoices)
      .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
      .where(eq(invoices.id, metadata.invoiceId));
  }

  return { success: true, paymentId: payment.id };
}

// ============================================================
// PAYMENT & INVOICE STORAGE
// ============================================================

export async function getPaymentsByClient(clientId: string): Promise<Payment[]> {
  return db.select().from(payments).where(eq(payments.clientId, clientId)).orderBy(desc(payments.createdAt));
}

export async function getAllPayments(): Promise<Payment[]> {
  return db.select().from(payments).orderBy(desc(payments.createdAt));
}

export async function getInvoicesByClient(clientId: string): Promise<Invoice[]> {
  return db.select().from(invoices).where(eq(invoices.clientId, clientId)).orderBy(desc(invoices.createdAt));
}

export async function getAllInvoices(): Promise<Invoice[]> {
  return db.select().from(invoices).orderBy(desc(invoices.createdAt));
}

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
  return invoice;
}

export async function createInvoice(data: Omit<InsertInvoice, "invoiceNumber">): Promise<Invoice> {
  // Generate invoice number
  const count = await db.select().from(invoices);
  const invoiceNumber = `INV-${String(count.length + 1).padStart(5, "0")}`;
  
  const [invoice] = await db.insert(invoices).values({
    ...data,
    invoiceNumber,
  }).returning();
  return invoice;
}

export async function updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice | undefined> {
  const [invoice] = await db.update(invoices)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(invoices.id, id))
    .returning();
  return invoice;
}

// Check if payments are enabled
export function isStripeEnabled(): boolean {
  return !!stripe;
}

export function isPayPalEnabled(): boolean {
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}
