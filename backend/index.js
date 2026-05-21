import dotenv from "dotenv";

dotenv.config(); // loads env -> process.env
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// import { buildJwt, verifyAuth } from "./utils/auth.js";

// DB initialization
import { testConnection, testTableExists } from "./database/index.js";

// Admin initialization or skip
import { createOrSkipAdminCreation } from "./config/index.js";

// Routes
import { router as userRouter } from "./routes/users.js";
import { router as taskRouter } from "./routes/tasks.js";

// Swagger imports
import { swaggerUi, swaggerSpec } from "./swagger.js";

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};

const app = express();
const PORT = process.env.PORT || 3000;

// Cors
app.use(cors(corsOptions));
// Middleware
app.use(express.json());
// Cookie
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Online");
});

// Swagger route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mounting routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tasks", taskRouter);

// Server initialization code
async function startServer() {
  await testConnection();
  await testTableExists();
  await createOrSkipAdminCreation();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
  });
}

startServer();
