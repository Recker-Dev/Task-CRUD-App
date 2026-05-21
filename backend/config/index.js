// Admin Creation
import bcrypt from "bcrypt";
import { createNewUser } from "../service/users.js";

export const createOrSkipAdminCreation = async () => {
  try {
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || null;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || null;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || null;

    // Kill process if env file does not have admin logic
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const user = await createNewUser({
      fullName: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      hashedPassword,
      role: "ADMIN",
    });

    console.log("Admin role created!");
  } catch (err) {
    if (err.message === "EMAIL_ALREADY_EXISTS") {
      // DO nothing, meaning admin creation done succesfully
      console.log("Admin already exists!");
    } else {
      console.log(err);
    }
  }
};
