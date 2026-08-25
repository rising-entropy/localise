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

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
