import { pool } from "../database/index.js";

const USERS_TABLE = process.env.USERS_TABLE;
const TASKS_TABLE = process.env.TASKS_TABLE;

// Create a new User
export const createNewUser = async ({
  fullName,
  email,
  hashedPassword,
  role = "USER",
}) => {
  const query = `
    INSERT INTO ${USERS_TABLE} 
     (full_name, email, password_hash,role )
    VALUES ($1, $2, $3, $4)
    RETURNING id, full_name, email, role
    `;

  try {
    const { rows } = await pool.query(query, [
      fullName,
      email,
      hashedPassword,
      role,
    ]);
    return rows[0];
  } catch (err) {
    // DB throws error if email is not unique
    if (err.constraint === "users_email_key") {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }
    throw err;
  }
};

// Get all users : This is for admin to view the list of users.
export const getAllUsers = async () => {
  const query = `
    SELECT id,full_name,created_at from ${USERS_TABLE}
    WHERE role = 'USER'
    `;

  const { rows } = await pool.query(query);
  return rows;
};

// Get a single user data : For Admin View of a single user. [CHECK VALID UUID BEFOREHAND]
export const getUser = async ({ id }) => {
  const query = `
    SELECT id,full_name,email,created_at from ${USERS_TABLE}
    WHERE role = 'USER' and id = $1
    `;

  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

// Update a user data: Done admin side
export const updateUser = async ({ id, full_name, email, role }) => {
  // values must always have this as $1
  const values = [id];
  let setClauses = [];
  if (full_name != null) {
    setClauses.push(`full_name = $${values.length + 1}`);
    values.push(full_name);
  }
  if (email != null) {
    setClauses.push(`email = $${values.length + 1}`);
    values.push(email);
  }
  if (role != null) {
    setClauses.push(`role = $${values.length + 1}`);
    values.push(role);
  }

  if (setClauses.length === 0) {
    throw new Error("No fields provided to update");
  }

  // updated_at to current timestamp
  setClauses.push(`updated_at = NOW()`);

  const formattedSetClauses = setClauses.join(",");

  const query = `
  UPDATE ${USERS_TABLE}
  SET ${formattedSetClauses}
  WHERE id = $1
  RETURNING id,full_name,email,role
  `;

  const { rows } = await pool.query(query, values);

  return rows[0] || null;
};

// Delete a user: [CHECK VALID UUID]
export const deleteUser = async ({ id }) => {
  const query = `
  DELETE FROM ${USERS_TABLE}
  WHERE id = $1 
  RETURNING id,full_name,email,role`;

  const { rows } = await pool.query(query, [id]);

  return rows[0] || null;
};

// Get tasks for a userId
export const getTaskByUser = async ({ userId }) => {
  const query = `
    SELECT 
      id,
      title,
      description,
      status,
      completion_note
    FROM ${TASKS_TABLE}
    WHERE assigned_to = $1
    ORDER BY created_at;
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows;
};

// Request Task completion
export const requestTaskCompletion = async ({ taskId, completionNote }) => {
  const query = `
    UPDATE ${TASKS_TABLE}
    SET 
      status = 'COMPLETED_REQUESTED',
      completion_note = $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING 
      id,
      title,
      status,
      completion_note;
  `;

  const { rows } = await pool.query(query, [completionNote, taskId]);

  return rows[0];
};
