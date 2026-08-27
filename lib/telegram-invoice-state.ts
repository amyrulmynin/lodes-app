import { db } from "@/db";
import { telegramInvoiceStates } from "@/db/schema";
import { eq } from "drizzle-orm";

// ============================================================
// Telegram Invoice Conversation State Manager (Database-backed)
// Works with Vercel serverless - persists between requests
// ============================================================

export interface InvoiceItem {
  name: string;
  price: number;
  quantity: number;
}

export interface InvoiceState {
  step:
    | "idle"
    | "awaiting_name"
    | "awaiting_phone"
    | "awaiting_address"
    | "awaiting_item_name"
    | "awaiting_item_price"
    | "awaiting_item_quantity"
    | "awaiting_more_items"
    | "awaiting_notes"
    | "awaiting_status"
    | "done";
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  currentItem: Partial<InvoiceItem>;
  notes: string;
  status: "accepted" | "paid" | "pending";
  invoiceNumber: string;
}

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface DbState {
  id: number;
  chatId: string;
  step: string;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  items: string;
  currentItem: string | null;
  notes: string | null;
  status: string;
  invoiceNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

function dbToState(row: DbState): InvoiceState {
  return {
    step: row.step as InvoiceState["step"],
    customerName: row.customerName || "",
    customerPhone: row.customerPhone || "",
    customerAddress: row.customerAddress || "",
    items: JSON.parse(row.items || "[]"),
    currentItem: row.currentItem ? JSON.parse(row.currentItem) : {},
    notes: row.notes || "",
    status: (row.status as InvoiceState["status"]) || "accepted",
    invoiceNumber: row.invoiceNumber,
  };
}

export async function getInvoiceState(chatId: string): Promise<InvoiceState | null> {
  try {
    const row = await db.query.telegramInvoiceStates.findFirst({
      where: eq(telegramInvoiceStates.chatId, chatId),
    });

    if (!row) return null;

    // Check timeout
    const age = Date.now() - new Date(row.updatedAt).getTime();
    if (age > TIMEOUT_MS) {
      await clearInvoiceState(chatId);
      return null;
    }

    return dbToState(row as DbState);
  } catch (error) {
    console.error("getInvoiceState error:", error);
    return null;
  }
}

export async function setInvoiceState(
  chatId: string,
  state: Partial<InvoiceState> & { step: InvoiceState["step"] }
): Promise<InvoiceState | null> {
  try {
    const existing = await db.query.telegramInvoiceStates.findFirst({
      where: eq(telegramInvoiceStates.chatId, chatId),
    });

    const now = new Date();
    const baseState: InvoiceState = existing
      ? dbToState(existing as DbState)
      : {
          step: "idle",
          customerName: "",
          customerPhone: "",
          customerAddress: "",
          items: [],
          currentItem: {},
          notes: "",
          status: "accepted",
          invoiceNumber: "",
        };

    const merged: InvoiceState = { ...baseState, ...state };

    if (existing) {
      await db
        .update(telegramInvoiceStates)
        .set({
          step: merged.step,
          customerName: merged.customerName || null,
          customerPhone: merged.customerPhone || null,
          customerAddress: merged.customerAddress || null,
          items: JSON.stringify(merged.items),
          currentItem: Object.keys(merged.currentItem).length > 0 ? JSON.stringify(merged.currentItem) : null,
          notes: merged.notes || null,
          status: merged.status,
          invoiceNumber: merged.invoiceNumber,
          updatedAt: now,
        })
        .where(eq(telegramInvoiceStates.chatId, chatId));
    } else {
      await db.insert(telegramInvoiceStates).values({
        chatId,
        step: merged.step,
        customerName: merged.customerName || null,
        customerPhone: merged.customerPhone || null,
        customerAddress: merged.customerAddress || null,
        items: JSON.stringify(merged.items),
        currentItem: Object.keys(merged.currentItem).length > 0 ? JSON.stringify(merged.currentItem) : null,
        notes: merged.notes || null,
        status: merged.status,
        invoiceNumber: merged.invoiceNumber,
        createdAt: now,
        updatedAt: now,
      });
    }

    return merged;
  } catch (error) {
    console.error("setInvoiceState error:", error);
    return null;
  }
}

export async function clearInvoiceState(chatId: string): Promise<void> {
  try {
    await db
      .delete(telegramInvoiceStates)
      .where(eq(telegramInvoiceStates.chatId, chatId));
  } catch (error) {
    console.error("clearInvoiceState error:", error);
  }
}

export async function isInvoiceActive(chatId: string): Promise<boolean> {
  const state = await getInvoiceState(chatId);
  return state !== null && state.step !== "idle" && state.step !== "done";
}
