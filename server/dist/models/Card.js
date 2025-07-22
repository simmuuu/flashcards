"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const cardSchema = new mongoose_1.Schema({
    front: { type: String, required: true, trim: true },
    back: { type: String, required: true, trim: true },
    easinessFactor: { type: Number, default: 2.5 },
    repetitions: { type: Number, default: 0 },
    interval: { type: Number, default: 0 }, // in days
    nextReview: { type: Date, default: () => new Date() },
    folder: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Folder', required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Card', cardSchema);
