import { config } from "dotenv";
config();

import { db } from "../db";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Starting migration...");

  try {
    // Drop old tables (if exist)
    await db.execute(sql`DROP TABLE IF EXISTS withdrawals CASCADE`);
    console.log("Dropped withdrawals table");

    // Rename affiliate columns to agent in orders table
    await db.execute(sql`ALTER TABLE orders RENAME COLUMN affiliate_id TO agent_id`);
    console.log("Renamed orders.affiliate_id to agent_id");

    // Drop commission columns from orders
    await db.execute(sql`ALTER TABLE orders DROP COLUMN IF EXISTS commission_amount`);
    console.log("Dropped orders.commission_amount");

    // Drop commission columns from desserts
    await db.execute(sql`ALTER TABLE desserts DROP COLUMN IF EXISTS commission_rate`);
    console.log("Dropped desserts.commission_rate");

    // Drop commission balance from users
    await db.execute(sql`ALTER TABLE users DROP COLUMN IF EXISTS commission_balance`);
    console.log("Dropped users.commission_balance");

    // Update role enum - remove affiliate, keep only admin
    // Note: PostgreSQL doesn't support removing enum values directly
    // We'll create a new enum and migrate
    await db.execute(sql`
      DO $$
      BEGIN
        -- Check if new enum exists
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_new') THEN
          CREATE TYPE role_new AS ENUM ('admin');
        END IF;
      END
      $$;
    `);
    console.log("Created new role enum");

    // Update users table to use new enum
    await db.execute(sql`
      ALTER TABLE users 
      ALTER COLUMN role TYPE role_new 
      USING (CASE WHEN role = 'admin' THEN 'admin'::role_new ELSE 'admin'::role_new END)
    `);
    console.log("Updated users.role to new enum");

    // Drop old enum and rename new one
    await db.execute(sql`DROP TYPE IF EXISTS role CASCADE`);
    await db.execute(sql`ALTER TYPE role_new RENAME TO role`);
    console.log("Replaced role enum");

    // Update reviews table
    await db.execute(sql`ALTER TABLE reviews RENAME COLUMN affiliate_id TO agent_id`);
    console.log("Renamed reviews.affiliate_id to agent_id");

    // Create new tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS agents (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        notes TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created agents table");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        notes TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created suppliers table");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS supplier_orders (
        id SERIAL PRIMARY KEY,
        supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
        order_number TEXT NOT NULL UNIQUE,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT '0.00',
        status TEXT NOT NULL DEFAULT 'draft',
        order_date TIMESTAMP NOT NULL DEFAULT NOW(),
        expected_date TIMESTAMP,
        received_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created supplier_orders table");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS supplier_order_items (
        id SERIAL PRIMARY KEY,
        supplier_order_id INTEGER NOT NULL REFERENCES supplier_orders(id),
        item_name TEXT NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit TEXT NOT NULL DEFAULT 'pcs',
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL
      )
    `);
    console.log("Created supplier_order_items table");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        supplier_id INTEGER REFERENCES suppliers(id),
        item_name TEXT NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit TEXT NOT NULL DEFAULT 'pcs',
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        purchase_date TIMESTAMP NOT NULL DEFAULT NOW(),
        receipt_url TEXT,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created purchases table");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        expense_date TIMESTAMP NOT NULL DEFAULT NOW(),
        receipt_url TEXT,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created expenses table");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS founder_salaries (
        id SERIAL PRIMARY KEY,
        founder_name TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        salary_month TEXT NOT NULL,
        paid_at TIMESTAMP NOT NULL DEFAULT NOW(),
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created founder_salaries table");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cash_flow (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        reference_id INTEGER,
        reference_type TEXT,
        flow_date TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created cash_flow table");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
