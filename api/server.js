require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello world" });
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

app.post("/submissions", async (req, res) => {
  const { audio_file, degrees } = req.body;

  if (!audio_file || typeof audio_file !== "string") {
    return res.status(400).json({ error: "audio_file must be a non-empty string" });
  }
  if (degrees === undefined || degrees === null || isNaN(Number(degrees))) {
    return res.status(400).json({ error: "degrees must be a number" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO submissions (audio_file, degrees) VALUES ($1, $2) RETURNING *",
      [audio_file, Number(degrees)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/submissions/bulk", async (req, res) => {
  const { submitter_uuid, submitted_at_epoch, responses } = req.body;

  if (!submitter_uuid || typeof submitter_uuid !== "string") {
    return res.status(400).json({ error: "submitter_uuid must be a non-empty string" });
  }
  if (submitted_at_epoch === undefined || submitted_at_epoch === null || isNaN(Number(submitted_at_epoch))) {
    return res.status(400).json({ error: "submitted_at_epoch must be a number" });
  }
  if (!Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ error: "responses must be a non-empty array" });
  }
  for (const r of responses) {
    if (!r.audio_file || typeof r.audio_file !== "string") {
      return res.status(400).json({ error: "each response requires a non-empty audio_file string" });
    }
    if (r.degrees === undefined || r.degrees === null || isNaN(Number(r.degrees))) {
      return res.status(400).json({ error: "each response requires a numeric degrees value" });
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = [];
    for (const r of responses) {
      const result = await client.query(
        "INSERT INTO submissions (audio_file, degrees, submitter_uuid, submitted_at_epoch) VALUES ($1, $2, $3, $4) RETURNING *",
        [r.audio_file, Number(r.degrees), submitter_uuid, Number(submitted_at_epoch)]
      );
      inserted.push(result.rows[0]);
    }
    await client.query("COMMIT");
    res.status(201).json(inserted);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Database error" });
  } finally {
    client.release();
  }
});

app.get("/submissions", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM submissions ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
