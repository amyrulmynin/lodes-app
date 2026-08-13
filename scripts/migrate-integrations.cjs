const { Pool, neonConfig } = require("@neondatabase/serverless");
const ws = require("ws");
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const status = await pool.query("SELECT status, COUNT(*) as c, COALESCE(SUM(total_price),0) as rev FROM orders GROUP BY status ORDER BY c DESC");
  console.log("By status:");
  status.rows.forEach(r => console.log("  ", r.status, "=>", r.c, "orders, RM", r.rev));
  const st = await pool.query("SELECT DISTINCT status FROM orders");
  console.log("Distinct statuses:", st.rows.map(r=>JSON.stringify(r.status)).join(", "));
  await pool.end();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
