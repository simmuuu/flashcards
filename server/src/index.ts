import express, { Express, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routes/auth";
import folderRoutes from "./routes/folders";
import cardRoutes from "./routes/cards";

// Passport configuration
import "./config/passport";

const app: Express = express();
const port = process.env.PORT || 5000;

// --- Middleware ---
app.use(helmet()); // Secure HTTP headers
app.use(cors({ origin: "http://localhost:3000", credentials: true })); // Allow client origin
app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize()); // Passport

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // Logger for development
}

// --- Database Connection ---
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("FATAL ERROR: MONGO_URI is not defined in .env file");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("MongoDB connected successfully."))
  .catch((err) => console.error("MongoDB connection error:", err));

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/cards", cardRoutes);

// --- Global Error Handler ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// --- Server Listening ---
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
