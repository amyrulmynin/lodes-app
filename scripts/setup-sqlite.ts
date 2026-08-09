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
    role TEXT NOT NULL DEFAULT 'affiliate',
    phone TEXT,
    bank_name TEXT,
    bank_account TEXT,
    commission_balance TEXT NOT NULL DEFAULT '0.00',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS desserts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price TEXT NOT NULL,
    image_url TEXT,
    commission_rate TEXT NOT NULL DEFAULT '10.00',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    affiliate_id INTEGER NOT NULL REFERENCES users(id),
    dessert_id INTEGER NOT NULL REFERENCES desserts(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price TEXT NOT NULL,
    commission_amount TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    notes TEXT,
    receipt_url TEXT,
    feedback_token TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    submitted_at INTEGER NOT NULL,
    processed_at INTEGER,
    processed_by INTEGER REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    affiliate_id INTEGER NOT NULL REFERENCES users(id),
    amount TEXT NOT NULL,
    withdrawal_method TEXT NOT NULL DEFAULT 'bank',
    bank_name TEXT,
    bank_account TEXT,
    account_holder TEXT,
    qr_code_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_at INTEGER NOT NULL,
    processed_at INTEGER,
    processed_by INTEGER REFERENCES users(id),
    notes TEXT
  );


  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id),
    affiliate_id INTEGER NOT NULL REFERENCES users(id),
    dessert_id INTEGER NOT NULL REFERENCES desserts(id),
    customer_name TEXT NOT NULL,
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
`);

console.log("Seeding data...");

const now = Date.now();

const existingUsers = sqlite.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };

if (existingUsers.count === 0) {
  const hashedAdmin = await hash("admin123", 10);
  const hashedAffiliate = await hash("affiliate123", 10);

  const insertUser = sqlite.prepare(`
    INSERT INTO users (email, password, name, role, phone, bank_name, bank_account, commission_balance, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run("admin@lodes.com", hashedAdmin, "Admin Lodes", "admin", "0123456789", null, null, "0.00", now, now);
  insertUser.run("affiliate@lodes.com", hashedAffiliate, "Demo Affiliate", "affiliate", "0198765432", "Maybank", "1234567890", "0.00", now, now);

  console.log("Users seeded: admin@lodes.com / admin123, affiliate@lodes.com / affiliate123");
} else {
  console.log("Users already exist, skipping...");
}

const existingDesserts = sqlite.prepare("SELECT COUNT(*) as count FROM desserts").get() as { count: number };

if (existingDesserts.count === 0) {
  const insertDessert = sqlite.prepare(`
    INSERT INTO desserts (name, description, price, image_url, commission_rate, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `);

  insertDessert.run("Banana Pudding Classic", "Creamy banana pudding dengan vanilla wafers dan whipped cream", "25.00", "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400", "15.00", now, now);
  insertDessert.run("Chocolate Banana Pudding", "Banana pudding dengan chocolate ganache", "30.00", "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400", "15.00", now, now);
  insertDessert.run("Strawberry Banana Pudding", "Banana pudding dengan fresh strawberries", "28.00", "https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=400", "12.00", now, now);
  insertDessert.run("Tiramisu", "Classic Italian tiramisu dengan coffee-soaked ladyfingers", "35.00", "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400", "20.00", now, now);

  console.log("Desserts seeded: 4 items");
} else {
  console.log("Desserts already exist, skipping...");
}

console.log("SQLite setup complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

