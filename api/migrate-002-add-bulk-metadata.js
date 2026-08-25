require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const sql = `
  ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS submitter_uuid TEXT,
    ADD COLUMN IF NOT EXISTS submitted_at_epoch DOUBLE PRECISION;
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("Migration complete: 'submitter_uuid' and 'submitted_at_epoch' columns added.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
