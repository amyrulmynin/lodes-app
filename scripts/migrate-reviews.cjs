const { Pool, neonConfig } = require("@neondatabase/serverless");
const ws = require("ws");
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  await pool.query("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_phone TEXT");
  await pool.query("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'order'");
  await pool.query("ALTER TABLE reviews ALTER COLUMN order_id DROP NOT NULL");
  await pool.query("ALTER TABLE reviews ALTER COLUMN affiliate_id DROP NOT NULL");
  await pool.query("ALTER TABLE reviews ALTER COLUMN dessert_id DROP NOT NULL");
  const r = await pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='reviews' ORDER BY ordinal_position");
  console.log(r.rows.map(x => x.column_name + "(" + x.is_nullable + ")").join(", "));
  await pool.end();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
