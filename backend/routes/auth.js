import express from "express";
export const router = express.Router();
import { getUserByEmail } from "../service/auth.js";
import { createNewUser } from "../service/users.js";
import { buildJwt } from "../utils/auth.js";
import bcrypt from "bcrypt";

// Register employee [PUBLIC ROUTE]
/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new employee (Public)
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Employee registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Server error
 */
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validate input
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createNewUser({ fullName, email, hashedPassword });

    res.status(201).json({
      success: true,
      message: "Employee registered successfully",
      employee: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (err) {
    if (err.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({
        success: false,
        error: "Email already exists",
      });
    }
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Login Employee [PUBLIC ROUTE]
/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login employee (Public)
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authenticated:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 employee:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const user = await getUserByEmail({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid Login Credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid Login Credentials",
      });
    }

    const jwt = await buildJwt({
      email: user.email,
      id: user.id,
      role: user.role,
    });

    res.cookie("token", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 2, // 2 days
    });

    res.status(200).json({
      authenticated: true,
      message: "Login Succesfull!",
      employee: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
