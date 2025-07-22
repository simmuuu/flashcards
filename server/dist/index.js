"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const passport_1 = __importDefault(require("passport"));
// Load environment variables
dotenv_1.default.config();
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const folders_1 = __importDefault(require("./routes/folders"));
const cards_1 = __importDefault(require("./routes/cards"));
const stats_1 = __importDefault(require("./routes/stats"));
// Passport configuration
require("./config/passport");
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// --- Middleware ---
app.use((0, helmet_1.default)()); // Secure HTTP headers
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true })); // Allow client origin
app.use(express_1.default.json()); // Body parser
app.use(express_1.default.urlencoded({ extended: true }));
app.use(passport_1.default.initialize()); // Passport
if (process.env.NODE_ENV === "development") {
    app.use((0, morgan_1.default)("dev")); // Logger for development
}
// --- Database Connection ---
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    console.error("FATAL ERROR: MONGO_URI is not defined in .env file");
    process.exit(1);
}
mongoose_1.default
    .connect(mongoUri)
    .then(() => console.log("MongoDB connected successfully."))
    .catch((err) => console.error("MongoDB connection error:", err));
// --- API Routes ---
app.use("/api/auth", auth_1.default);
app.use("/api/folders", folders_1.default);
app.use("/api/cards", cards_1.default);
app.use("/api/stats", stats_1.default);
// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});
// --- Server Listening ---
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
