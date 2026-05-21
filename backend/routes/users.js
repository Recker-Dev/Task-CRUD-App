import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { validate as isUUID } from "uuid";
import {
  getUser,
  getAllUsers,
  updateUser,
  deleteUser,
} from "../service/users.js";

export const router = express.Router();
/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
 */
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await getAllUsers();

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID
 *     responses:
 *       200:
 *         description: User fetched successfully
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID first
    if (!isUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await getUser({ id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user: user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     summary: Update user (Admin only)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role } = req.body;

    // Validate UUID
    if (!isUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Role validation
    if (role && !["USER", "ADMIN"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const updatedUser = await updateUser({
      id,
      full_name,
      email,
      role,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);

    if (error.message === "No fields provided to update") {
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
 * /users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
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
        message: "Invalid user ID",
      });
    }

    const deletedUser = await deleteUser({ id });

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found ",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});



