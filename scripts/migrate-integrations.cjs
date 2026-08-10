const { Pool, neonConfig } = require("@neondatabase/serverless");
const ws = require("ws");
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_proof_url TEXT");
  console.log("delivery_proof_url added");
  await pool.end();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
