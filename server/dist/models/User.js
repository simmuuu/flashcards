"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.Schema({
    googleId: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false }, // Hide password by default
    name: { type: String, required: true, trim: true },
}, { timestamps: true });
// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
    next();
});
// Method to compare passwords
userSchema.methods.comparePassword = function (password) {
    if (!this.password)
        return Promise.resolve(false);
    return bcryptjs_1.default.compare(password, this.password);
};
exports.default = (0, mongoose_1.model)('User', userSchema);
