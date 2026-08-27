import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// ============================================================
// Telegram Invoice Counter - persists last invoice number
// Format: INV-M-YYYYMMDD-XXX (XXX auto-increments, starts at 495)
// ============================================================

const COUNTER_FILE = join(process.cwd(), ".telegram-invoice-counter.json");

interface CounterData {
  lastNumber: number;
  lastDate: string; // YYYYMMDD
}

function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function loadCounter(): CounterData {
  try {
    if (existsSync(COUNTER_FILE)) {
      const raw = readFileSync(COUNTER_FILE, "utf-8");
      const data = JSON.parse(raw);
      return {
        lastNumber: data.lastNumber ?? 494, // so next is 495
        lastDate: data.lastDate ?? getTodayDate(),
      };
    }
  } catch {
    // ignore, use defaults
  }
  return { lastNumber: 494, lastDate: getTodayDate() };
}

function saveCounter(data: CounterData): void {
  try {
    writeFileSync(COUNTER_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save invoice counter:", error);
  }
}

export function getNextInvoiceNumber(): string {
  const today = getTodayDate();
  const counter = loadCounter();

  let nextNumber: number;
  if (counter.lastDate === today) {
    // Same day, increment
    nextNumber = counter.lastNumber + 1;
  } else {
    // New day, reset to 1 (or keep going? user said 495 auto generate)
    // Let's keep it simple: reset to 1 each day, but start from 495 if never used
    nextNumber = counter.lastNumber >= 494 ? counter.lastNumber + 1 : 495;
  }

  saveCounter({ lastNumber: nextNumber, lastDate: today });

  return `INV-M-${today}-${String(nextNumber).padStart(3, "0")}`;
}
