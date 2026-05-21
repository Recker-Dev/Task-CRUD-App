import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import {
  createNewTask,
  getAllTasks,
  getTask,
  updateTask,
  deleteTask,
  approveTaskCompletion,
  getTaskByUser,
  requestTaskCompletion,
} from "../service/tasks.js";

import { validate as isUUID } from "uuid";

export const router = express.Router();

/**
 * @openapi
 * /tasks:
 *   post:
 *     summary: Create a new task (Admin only)
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - assignedToId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assignedToId:
 *                 type: string
 *                 description: UUID of assigned user
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, assignedToId } = req.body;

    // Basic validations
    if (!title || !assignedToId) {
      return res.status(400).json({
        success: false,
        message: "Title and assignedToId are required",
      });
    }

    // Validate UUID
    if (!isUUID(assignedToId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignedToId",
      });
    }

    const { id: createdById } = req.credentials;

    const task = await createNewTask({
      title,
      description,
      assignedToId,
      createdById,
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @openapi
 * /tasks:
 *   get:
 *     summary: Get all tasks (Admin only)
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, COMPLETED_REQUESTED, COMPLETED]
 *       - in: query
 *         name: assignedToId
 *         schema:
 *           type: string
 *           description: UUID of assigned user
 *     responses:
 *       200:
 *         description: Tasks fetched successfully
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, assignedToId } = req.query;

    const validStatuses = [
      "TODO",
      "IN_PROGRESS",
      "COMPLETED_REQUESTED",
      "COMPLETED",
    ];

    // Validate status
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Allowed values: TODO, IN_PROGRESS, COMPLETED_REQUESTED, COMPLETED",
      });
    }

    // Validate UUID
    if (assignedToId && !isUUID(assignedToId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignedToId",
      });
    }

    const tasks = await getAllTasks({
      status,
      assignedToId,
    });

    return res.status(200).json({
      success: true,
      message: "Tasks fetched successfully",
      tasks: tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ESSENTIAL THAT /my-tasks STAY ABOVE /:id

/**
 * @openapi
 * /users/my-tasks:
 *   get:
 *     summary: Get logged-in user's tasks
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User tasks fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get("/my-tasks", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.credentials;

    const tasks = await getTaskByUser({ userId });

    return res.status(200).json({
      success: true,
      message: "User tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    console.error("Get my tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @openapi
 * /tasks/{id}:
 *   get:
 *     summary: Get task by ID (Admin only)
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task UUID
 *     responses:
 *       200:
 *         description: Task fetched successfully
 *       400:
 *         description: Invalid task ID
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!isUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await getTask({ id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task fetched successfully",
      data: task,
    });
  } catch (error) {
    console.error("Get task error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @openapi
 * /tasks/{id}:
 *   patch:
 *     summary: Update task (Admin only)
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, COMPLETED_REQUESTED, COMPLETED]
 *               completion_note:
 *                 type: string
 *               assignedToId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { title, description, status, completion_note, assignedToId } =
      req.body;

    // Validate task UUID
    if (!isUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    // Validate assignedToId UUID
    if (assignedToId && !isUUID(assignedToId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignedToId",
      });
    }

    // Validate status
    const validStatuses = [
      "TODO",
      "IN_PROGRESS",
      "COMPLETED_REQUESTED",
      "COMPLETED",
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Allowed values: TODO, IN_PROGRESS, COMPLETED_REQUESTED, COMPLETED",
      });
    }

    const updatedTask = await updateTask({
      id,
      title,
      description,
      status,
      completion_note,
      assignedToId,
    });

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);

    if (error.message === "No fields provided for update") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @openapi
 * /tasks/{id}:
 *   delete:
 *     summary: Delete task (Admin only)
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task UUID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       400:
 *         description: Invalid task ID
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!isUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    await deleteTask({ id });

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    if (error.message === "Task not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @openapi
 * /tasks/{id}/approve:
 *   patch:
 *     summary: Approve task completion (Admin only)
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task UUID
 *     responses:
 *       200:
 *         description: Task completion approved successfully
 *       400:
 *         description: Invalid task ID
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:id/approve",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validate UUID
      if (!isUUID(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task ID",
        });
      }

      const updatedTask = await approveTaskCompletion({ id });

      if (!updatedTask) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Task completion approved successfully",
        data: updatedTask,
      });
    } catch (error) {
      console.error("Approve task completion error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

/**
 * @openapi
 * /tasks/{id}/request-complete:
 *   patch:
 *     summary: Request task completion
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - completionNote
 *             properties:
 *               completionNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task completion requested successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id/request-complete", authMiddleware, async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const { completionNote } = req.body;

    const userId = req.credentials.id;

    // Validate UUID
    if (!isUUID(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID or userId",
      });
    }

    if (!completionNote) {
      return res.status(400).json({
        success: false,
        message: "completionNote is required",
      });
    }

    const updatedTask = await requestTaskCompletion({
      taskId: taskId,
      userId,
      completionNote,
    });

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to you",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task completion requested successfully",
      data: updatedTask,
    });
  } catch (error) {
    console.error("Request task completion error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
