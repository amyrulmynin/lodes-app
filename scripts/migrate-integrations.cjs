const { Pool, neonConfig } = require("@neondatabase/serverless");
const crypto = require("crypto");
const ws = require("ws");
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const rows = await pool.query("SELECT id FROM orders WHERE driver_token IS NULL OR tracking_token IS NULL");
  for (const r of rows.rows) {
    const dt = crypto.randomBytes(20).toString("hex");
    const tt = crypto.randomBytes(20).toString("hex");
    await pool.query("UPDATE orders SET driver_token=$1, tracking_token=COALESCE(tracking_token,$2) WHERE id=$3", [dt, tt, r.id]);
  }
  console.log("backfilled", rows.rows.length, "orders");
  await pool.end();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
