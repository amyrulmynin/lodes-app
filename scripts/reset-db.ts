import { config } from "dotenv";
config();

import { db } from "../db";
import { sql } from "drizzle-orm";

async function reset() {
  console.log("Starting database reset...");

  try {
    // Drop all tables in correct order (respecting foreign keys)
    const tables = [
      "delivery_locations",
      "stock_movements",
      "ingredients",
      "integration_settings",
      "payment_settings",
      "reviews",
      "cash_flow",
      "founder_salaries",
      "expenses",
      "purchases",
      "supplier_order_items",
      "supplier_orders",
      "orders",
      "suppliers",
      "agents",
      "desserts",
      "users",
    ];

    for (const table of tables) {
      await db.execute(sql`DROP TABLE IF EXISTS ${sql.identifier(table)} CASCADE`);
      console.log(`Dropped ${table}`);
    }

    // Drop old enums
    await db.execute(sql`DROP TYPE IF EXISTS role CASCADE`);
    await db.execute(sql`DROP TYPE IF EXISTS order_status CASCADE`);
    await db.execute(sql`DROP TYPE IF EXISTS withdrawal_status CASCADE`);
    await db.execute(sql`DROP TYPE IF EXISTS cash_flow_type CASCADE`);
    await db.execute(sql`DROP TYPE IF EXISTS purchase_status CASCADE`);
    await db.execute(sql`DROP TYPE IF EXISTS supplier_order_status CASCADE`);
    console.log("Dropped old enums");

    console.log("All tables dropped. Database is now empty.");
    console.log("Run 'npm run db:push' to recreate tables from schema.");
  } catch (error) {
    console.error("Reset failed:", error);
    process.exit(1);
  }
}

reset();
