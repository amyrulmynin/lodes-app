const { Pool, neonConfig } = require("@neondatabase/serverless");
const ws = require("ws");
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7)");
  await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7)");
  await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS location_accuracy NUMERIC(10,2)");
  await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_token TEXT");
  await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS orders_tracking_token_unique ON orders(tracking_token)");
  console.log("location columns added");
  await pool.end();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
