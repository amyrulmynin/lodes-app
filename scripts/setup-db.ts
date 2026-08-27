import { config } from "dotenv";
config();

import { db } from "../db";
import { sql } from "drizzle-orm";
import { hash } from "bcryptjs";

async function setup() {
  console.log("Setting up database...");

  try {
    // Create enums first
    await db.execute(sql`CREATE TYPE role AS ENUM ('admin')`);
    await db.execute(sql`CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'rejected', 'out_for_delivery', 'delivered')`);
    await db.execute(sql`CREATE TYPE cash_flow_type AS ENUM ('in', 'out')`);
    await db.execute(sql`CREATE TYPE purchase_status AS ENUM ('pending', 'received', 'cancelled')`);
    await db.execute(sql`CREATE TYPE supplier_order_status AS ENUM ('draft', 'sent', 'received', 'cancelled')`);
    console.log("Created enums");

    // Create tables
    await db.execute(sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role role NOT NULL DEFAULT 'admin',
        phone TEXT,
        bank_name TEXT,
        bank_account TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created users table");

    await db.execute(sql`
      CREATE TABLE desserts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created desserts table");

    await db.execute(sql`
      CREATE TABLE agents (
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
      CREATE TABLE suppliers (
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
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER REFERENCES agents(id),
        dessert_id INTEGER NOT NULL REFERENCES desserts(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        total_price DECIMAL(10,2) NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_address TEXT,
        notes TEXT,
        receipt_url TEXT,
        feedback_token TEXT UNIQUE,
        payment_method TEXT,
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        mudahpay_txn_id TEXT,
        paid_at TIMESTAMP,
        latitude DECIMAL(10,7),
        longitude DECIMAL(10,7),
        location_accuracy DECIMAL(10,2),
        tracking_token TEXT UNIQUE,
        driver_token TEXT UNIQUE,
        delivery_proof_url TEXT,
        status order_status NOT NULL DEFAULT 'pending',
        submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMP,
        processed_by INTEGER REFERENCES users(id)
      )
    `);
    console.log("Created orders table");

    await db.execute(sql`
      CREATE TABLE supplier_orders (
        id SERIAL PRIMARY KEY,
        supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
        order_number TEXT NOT NULL UNIQUE,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT '0.00',
        status supplier_order_status NOT NULL DEFAULT 'draft',
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
      CREATE TABLE supplier_order_items (
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
      CREATE TABLE purchases (
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
      CREATE TABLE expenses (
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
      CREATE TABLE founder_salaries (
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
      CREATE TABLE cash_flow (
        id SERIAL PRIMARY KEY,
        type cash_flow_type NOT NULL,
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

    await db.execute(sql`
      CREATE TABLE payment_settings (
        id SERIAL PRIMARY KEY,
        qr_code_url TEXT,
        bank_name TEXT,
        account_number TEXT,
        account_holder TEXT,
        payment_instructions TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created payment_settings table");

    await db.execute(sql`
      CREATE TABLE reviews (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) UNIQUE,
        agent_id INTEGER REFERENCES agents(id),
        dessert_id INTEGER REFERENCES desserts(id),
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        source TEXT NOT NULL DEFAULT 'order',
        rating INTEGER NOT NULL,
        comment TEXT,
        is_visible INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created reviews table");

    await db.execute(sql`
      CREATE TABLE integration_settings (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        is_enabled INTEGER NOT NULL DEFAULT 0,
        config TEXT NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created integration_settings table");

    await db.execute(sql`
      CREATE TABLE ingredients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        unit TEXT NOT NULL DEFAULT 'pcs',
        current_stock DECIMAL(10,2) NOT NULL DEFAULT '0',
        min_stock_level DECIMAL(10,2) NOT NULL DEFAULT '0',
        cost_per_unit DECIMAL(10,2),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created ingredients table");

    await db.execute(sql`
      CREATE TABLE stock_movements (
        id SERIAL PRIMARY KEY,
        ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
        type TEXT NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        note TEXT,
        receipt_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created stock_movements table");

    await db.execute(sql`
      CREATE TABLE delivery_locations (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        latitude DECIMAL(10,7) NOT NULL,
        longitude DECIMAL(10,7) NOT NULL,
        accuracy DECIMAL(10,2),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created delivery_locations table");

    // Seed data
    console.log("Seeding data...");

    const hashedPassword = await hash("admin123", 10);
    await db.execute(sql`
      INSERT INTO users (email, password, name, role, phone, created_at, updated_at)
      VALUES ('admin@lodes.com', ${hashedPassword}, 'Admin Lodes', 'admin', '0123456789', NOW(), NOW())
    `);
    console.log("Seeded admin user");

    await db.execute(sql`
      INSERT INTO desserts (name, description, price, image_url, is_active, created_at, updated_at)
      VALUES 
        ('Banana Pudding Classic', 'Creamy banana pudding dengan vanilla wafers dan whipped cream', '25.00', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', 1, NOW(), NOW()),
        ('Chocolate Banana Pudding', 'Banana pudding dengan chocolate ganache', '30.00', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', 1, NOW(), NOW()),
        ('Strawberry Banana Pudding', 'Banana pudding dengan fresh strawberries', '28.00', 'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=400', 1, NOW(), NOW()),
        ('Tiramisu', 'Classic Italian tiramisu dengan coffee-soaked ladyfingers', '35.00', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400', 1, NOW(), NOW())
    `);
    console.log("Seeded desserts");

    await db.execute(sql`
      INSERT INTO agents (name, phone, email, address, notes, is_active, created_at, updated_at)
      VALUES ('Agent Demo', '0198765432', 'agent@demo.com', 'Kuala Lumpur', 'Agent contoh', 1, NOW(), NOW())
    `);
    console.log("Seeded agent");

    await db.execute(sql`
      INSERT INTO suppliers (name, phone, email, address, notes, is_active, created_at, updated_at)
      VALUES ('Supplier Demo', '0134567890', 'supplier@demo.com', 'Shah Alam', 'Supplier contoh', 1, NOW(), NOW())
    `);
    console.log("Seeded supplier");

    console.log("Database setup completed successfully!");
  } catch (error) {
    console.error("Setup failed:", error);
    process.exit(1);
  }
}

setup();
