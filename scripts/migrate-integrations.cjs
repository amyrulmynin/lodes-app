const { Pool, neonConfig } = require("@neondatabase/serverless");
const ws = require("ws");
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  // check payment_method column type + enum values
  const col = await pool.query("SELECT data_type, udt_name FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method'");
  console.log("payment_method:", JSON.stringify(col.rows));
  if (col.rows[0] && col.rows[0].udt_name !== 'text') {
    const en = await pool.query(`SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname=$1`, [col.rows[0].udt_name]);
    console.log("enum values:", en.rows.map(r=>r.enumlabel).join(", "));
  }
  await pool.end();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
