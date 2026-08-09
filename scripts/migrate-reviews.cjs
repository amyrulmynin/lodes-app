const { Pool, neonConfig } = require("@neondatabase/serverless");
const ws = require("ws");
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS feedback_token TEXT");
  await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS orders_feedback_token_unique ON orders(feedback_token)");
  await pool.query("CREATE TABLE IF NOT EXISTS reviews (id SERIAL PRIMARY KEY, order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id), affiliate_id INTEGER NOT NULL REFERENCES users(id), dessert_id INTEGER NOT NULL REFERENCES desserts(id), customer_name TEXT NOT NULL, rating INTEGER NOT NULL, comment TEXT, is_visible INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMP NOT NULL DEFAULT NOW())");
  const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='orders' AND column_name='feedback_token'");
  const tbl = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name='reviews'");
  console.log("feedback_token col:", cols.rows.length, "| reviews table:", tbl.rows.length);
  await pool.end();
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
