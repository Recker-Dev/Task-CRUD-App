import { pool } from "../database/index.js";

const USERS_TABLE = process.env.USERS_TABLE;

// Verifies login credentials
export const getUserByEmail = async ({ email }) => {
  const query = `
    SELECT id,full_name,email,role,password_hash from ${USERS_TABLE}
    WHERE email = $1 
    `;

  const { rows } = await pool.query(query, [email]);
  return rows[0];
};
