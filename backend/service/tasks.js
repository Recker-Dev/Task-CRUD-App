import { pool } from "../database/index.js";

const USERS_TABLE = process.env.USERS_TABLE;
const TASKS_TABLE = process.env.TASKS_TABLE;

// Create a new Task
export const createNewTask = async ({
  title,
  description,
  assignedToId,
  createdById,
}) => {
  const query = `
    WITH new_task AS (
    INSERT INTO ${TASKS_TABLE} 
     (title, description, assigned_to, created_by)
    VALUES ($1, $2, $3, $4)
    RETURNING id, title, description, status, assigned_to, created_by
    )

    SELECT
    nt.id,
    nt.title,
    nt.description,
    nt.status,
    nt.created_by,
    u.id as assigned_to_id,
    u.full_name as assigned_to_name,
    u.role as assigned_to_role

    FROM new_task as nt
    INNER JOIN 
    ${USERS_TABLE} as u ON nt.assigned_to = u.id;
    `;

  const { rows } = await pool.query(query, [
    title,
    description,
    assignedToId,
    createdById,
  ]);
  return rows[0];
};

// Get all Tasks : [VERIFY assignedToID is uuid, status is either [TODO,IN_PROGRESS,COMPLETED_REQUESTED,COMPLETED]]
export const getAllTasks = async ({ status = null, assignedToId = null }) => {
  const conditions = [];
  const values = [];

  if (status) {
    conditions.push(`t.status = $${values.length + 1}`);
    values.push(status);
  }

  if (assignedToId) {
    conditions.push(`t.assigned_to = $${values.length + 1}`);
    values.push(assignedToId);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT t.id, 
    t.title, 
    t.description, 
    t.status, 
    t.assigned_to, 
    u.full_name as assigned_to_name, 
    u.role as assigned_to_role
    
    FROM ${TASKS_TABLE} t
    INNER JOIN
    ${USERS_TABLE} u ON t.assigned_to = u.id
    ${whereClause};
    `;

  const { rows } = await pool.query(query, values);
  return rows;
};

// Get a single task: [VERIFY UUID]
export const getTask = async ({ id }) => {
  const query = `
    SELECT t.id, 
    t.title, 
    t.description, 
    t.status,
    t.completion_note, 
    t.assigned_to, 
    u.full_name as assigned_to_name, 
    u.role as assigned_to_role
    
    FROM ${TASKS_TABLE} t
    INNER JOIN
    ${USERS_TABLE} u ON t.assigned_to = u.id
    WHERE t.id = $1;
    `;

  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

// Update a task: [Provide Fields as deemed needed]
export const updateTask = async ({
  id,
  title,
  description,
  status,
  completion_note,
  assignedToId,
}) => {
  const updates = [];
  const values = [];

  if (title !== undefined) {
    values.push(title);
    updates.push(`title = $${values.length}`);
  }

  if (description !== undefined) {
    values.push(description);
    updates.push(`description = $${values.length}`);
  }

  if (status !== undefined) {
    values.push(status);
    updates.push(`status = $${values.length}`);
  }

  if (completion_note !== undefined) {
    values.push(completion_note);
    updates.push(`completion_note = $${values.length}`);
  }

  if (assignedToId !== undefined) {
    values.push(assignedToId);
    updates.push(`assigned_to = $${values.length}`);
  }

  if (updates.length === 0) {
    throw new Error("No fields provided for update");
  }

  updates.push(`updated_at = NOW()`);

  values.push(id);

  const query = `
    UPDATE ${TASKS_TABLE}
    SET ${updates.join(", ")}
    WHERE id = $${values.length}
    RETURNING *;
  `;

  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Delete as task : [VERIFY UUID]
export const deleteTask = async ({ id }) => {
  const query = `
    DELETE FROM ${TASKS_TABLE}
    WHERE id = $1;
  `;

  const { rowCount } = await pool.query(query, [id]);

  if (rowCount === 0) {
    throw new Error("Task not found");
  }

  return true;
};

// Approve Completion Request
export const approveTaskCompletion = async ({ id }) => {
  const query = `
    UPDATE ${TASKS_TABLE}
    SET status ='COMPLETED', updated_at = NOW()
    WHERE id = $1
    RETURNING id,status
    `;

  const { rows } = await pool.query(query, [id]);
  return rows[0];
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
export const requestTaskCompletion = async ({ userId, taskId, completionNote }) => {
  const query = `
    UPDATE ${TASKS_TABLE}
    SET 
      status = 'COMPLETED_REQUESTED',
      completion_note = $1,
      updated_at = NOW()
    WHERE id = $2 AND assigned_to = $3
    RETURNING 
      id,
      title,
      status,
      completion_note;
  `;

  const { rows } = await pool.query(query, [completionNote, taskId, userId]);

  return rows[0];
};
