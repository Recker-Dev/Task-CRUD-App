import express from "express";
export const router = express.Router();
import { createNewUser } from "../service/users.js";
import bcrypt from "bcrypt";

// Register employee
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
