const { Pool, neonConfig } = require("@neondatabase/serverless");
const ws = require("ws");
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS ingredients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'pcs',
    current_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
    min_stock_level NUMERIC(10,2) NOT NULL DEFAULT 0,
    cost_per_unit NUMERIC(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
    type TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL,
    note TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`);
  console.log("stock tables created");
  await pool.end();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
