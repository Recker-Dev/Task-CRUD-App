import dotenv from "dotenv";
import pkg from "pg";

dotenv.config(); // loads env -> process.env
const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// pool.on("connect", () => {
//   console.log("Connection established.");
// });

pool.on("error", (err) => {
  console.error("Unexpected PG error", err);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing pool");
  await pool.end();
  process.exit(0);
});


// Checks if DB Exist
export const testConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW()"); // <- returns current date
    console.log("DB connected:", result.rows[0]);
  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }
};

// Checks if Tables Exist
export const testTableExists = async () => {
  try {
    const result = await pool.query(`SELECT 1 from ${process.env.USERS_TABLE}
      UNION ALL
      SELECT 1 from ${process.env.TASKS_TABLE} `);
    console.log("Tables Exist. Proceeding...");
  } catch (err) {
    console.error("Table lookup failed:", err);
    process.exit(1);
  }
};

