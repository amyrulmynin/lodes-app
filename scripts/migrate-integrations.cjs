const { Pool, neonConfig } = require("@neondatabase/serverless");
const ws = require("ws");
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const r = await pool.query("SELECT id, status, payment_status, tracking_token FROM orders WHERE id=30");
  console.log(JSON.stringify(r.rows));
  await pool.end();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
