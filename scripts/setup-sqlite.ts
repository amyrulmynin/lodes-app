import Database from "better-sqlite3";
import { hash } from "bcryptjs";

async function main() {
const sqlite = new Database("sqlite.db");

console.log("Creating tables...");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    phone TEXT,
    bank_name TEXT,
    bank_account TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS desserts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price TEXT NOT NULL,
    image_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER REFERENCES agents(id),
    dessert_id INTEGER NOT NULL REFERENCES desserts(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    notes TEXT,
    receipt_url TEXT,
    feedback_token TEXT UNIQUE,
    payment_method TEXT,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    mudahpay_txn_id TEXT,
    paid_at INTEGER,
    latitude TEXT,
    longitude TEXT,
    location_accuracy TEXT,
    tracking_token TEXT UNIQUE,
    driver_token TEXT UNIQUE,
    delivery_proof_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    submitted_at INTEGER NOT NULL,
    processed_at INTEGER,
    processed_by INTEGER REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS supplier_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    order_number TEXT NOT NULL UNIQUE,
    total_amount TEXT NOT NULL DEFAULT '0.00',
    status TEXT NOT NULL DEFAULT 'draft',
    order_date INTEGER NOT NULL,
    expected_date INTEGER,
    received_date INTEGER,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS supplier_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_order_id INTEGER NOT NULL REFERENCES supplier_orders(id),
    item_name TEXT NOT NULL,
    quantity TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'pcs',
    unit_price TEXT NOT NULL,
    total_price TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER REFERENCES suppliers(id),
    item_name TEXT NOT NULL,
    quantity TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'pcs',
    unit_price TEXT NOT NULL,
    total_price TEXT NOT NULL,
    purchase_date INTEGER NOT NULL,
    receipt_url TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount TEXT NOT NULL,
    expense_date INTEGER NOT NULL,
    receipt_url TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS founder_salaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    founder_name TEXT NOT NULL,
    amount TEXT NOT NULL,
    salary_month TEXT NOT NULL,
    paid_at INTEGER NOT NULL,
    notes TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cash_flow (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount TEXT NOT NULL,
    reference_id INTEGER,
    reference_type TEXT,
    flow_date INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER UNIQUE REFERENCES orders(id),
    agent_id INTEGER REFERENCES agents(id),
    dessert_id INTEGER REFERENCES desserts(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    source TEXT NOT NULL DEFAULT 'order',
    rating INTEGER NOT NULL,
    comment TEXT,
    is_visible INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payment_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    qr_code_url TEXT,
    bank_name TEXT,
    account_number TEXT,
    account_holder TEXT,
    payment_instructions TEXT,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS integration_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    is_enabled INTEGER NOT NULL DEFAULT 0,
    config TEXT NOT NULL DEFAULT '{}',
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'pcs',
    current_stock TEXT NOT NULL DEFAULT '0',
    min_stock_level TEXT NOT NULL DEFAULT '0',
    cost_per_unit TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
    type TEXT NOT NULL,
    quantity TEXT NOT NULL,
    note TEXT,
    receipt_url TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS delivery_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    latitude TEXT NOT NULL,
    longitude TEXT NOT NULL,
    accuracy TEXT,
    created_at INTEGER NOT NULL
  );
`);

console.log("Seeding data...");

const now = Date.now();

const existingUsers = sqlite.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };

if (existingUsers.count === 0) {
  const hashedAdmin = await hash("admin123", 10);

  const insertUser = sqlite.prepare(`
    INSERT INTO users (email, password, name, role, phone, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run("admin@lodes.com", hashedAdmin, "Admin Lodes", "admin", "0123456789", now, now);

  console.log("Users seeded: admin@lodes.com / admin123");
} else {
  console.log("Users already exist, skipping...");
}

const existingDesserts = sqlite.prepare("SELECT COUNT(*) as count FROM desserts").get() as { count: number };

if (existingDesserts.count === 0) {
  const insertDessert = sqlite.prepare(`
    INSERT INTO desserts (name, description, price, image_url, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, 1, ?, ?)
  `);

  insertDessert.run("Banana Pudding Classic", "Creamy banana pudding dengan vanilla wafers dan whipped cream", "25.00", "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400", now, now);
  insertDessert.run("Chocolate Banana Pudding", "Banana pudding dengan chocolate ganache", "30.00", "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400", now, now);
  insertDessert.run("Strawberry Banana Pudding", "Banana pudding dengan fresh strawberries", "28.00", "https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=400", now, now);
  insertDessert.run("Tiramisu", "Classic Italian tiramisu dengan coffee-soaked ladyfingers", "35.00", "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400", now, now);

  console.log("Desserts seeded: 4 items");
} else {
  console.log("Desserts already exist, skipping...");
}

const existingAgents = sqlite.prepare("SELECT COUNT(*) as count FROM agents").get() as { count: number };

if (existingAgents.count === 0) {
  const insertAgent = sqlite.prepare(`
    INSERT INTO agents (name, phone, email, address, notes, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `);

  insertAgent.run("Agent Demo", "0198765432", "agent@demo.com", "Kuala Lumpur", "Agent contoh", now, now);

  console.log("Agents seeded: 1 item");
} else {
  console.log("Agents already exist, skipping...");
}

const existingSuppliers = sqlite.prepare("SELECT COUNT(*) as count FROM suppliers").get() as { count: number };

if (existingSuppliers.count === 0) {
  const insertSupplier = sqlite.prepare(`
    INSERT INTO suppliers (name, phone, email, address, notes, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `);

  insertSupplier.run("Supplier Demo", "0134567890", "supplier@demo.com", "Shah Alam", "Supplier contoh", now, now);

  console.log("Suppliers seeded: 1 item");
} else {
  console.log("Suppliers already exist, skipping...");
}

console.log("SQLite setup complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
