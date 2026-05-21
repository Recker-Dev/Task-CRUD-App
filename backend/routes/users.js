import express from "express";
export const router = express.Router();

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     description: Fetches all registered users from the database.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: Get all users
 *       500:
 *         description: Internal server error
 */
router.get("/", (req, res) => {
  res.send("Get all users");
});