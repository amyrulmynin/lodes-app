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

    // Check if affiliate_id exists before renaming
    const ordersCols = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'affiliate_id'
    `);
    
    if (ordersCols.rows.length > 0) {
      await db.execute(sql`ALTER TABLE orders RENAME COLUMN affiliate_id TO agent_id`);
      console.log("Renamed orders.affiliate_id to agent_id");
    } else {
      console.log("orders.agent_id already exists, skipping rename");
    }

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
    // First, update all rows to 'admin' (since we're removing affiliate)
    await db.execute(sql`UPDATE users SET role = 'admin' WHERE role = 'affiliate'`);
    console.log("Updated affiliate users to admin");

    // Check if we need to create new enum
    const enumExists = await db.execute(sql`
      SELECT 1 FROM pg_type WHERE typname = 'role_new'
    `);
    
    if (enumExists.rows.length === 0) {
      await db.execute(sql`CREATE TYPE role_new AS ENUM ('admin')`);
      console.log("Created new role enum");
    }

    // Drop default temporarily
    await db.execute(sql`ALTER TABLE users ALTER COLUMN role DROP DEFAULT`);
    
    // Change column type
    await db.execute(sql`
      ALTER TABLE users 
      ALTER COLUMN role TYPE role_new 
      USING (role::text::role_new)
    `);
    console.log("Updated users.role to new enum");

    // Set new default
    await db.execute(sql`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'admin'::role_new`);
    console.log("Set new default for role");

    // Drop old enum and rename new one
    await db.execute(sql`DROP TYPE IF EXISTS role CASCADE`);
    await db.execute(sql`ALTER TYPE role_new RENAME TO role`);
    console.log("Replaced role enum");

    // Update reviews table
    const reviewsCols = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'reviews' AND column_name = 'affiliate_id'
    `);
    
    if (reviewsCols.rows.length > 0) {
      await db.execute(sql`ALTER TABLE reviews RENAME COLUMN affiliate_id TO agent_id`);
      console.log("Renamed reviews.affiliate_id to agent_id");
    } else {
      console.log("reviews.agent_id already exists, skipping rename");
    }

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
