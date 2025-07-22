"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const folderSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    isShared: { type: Boolean, default: false },
    shareId: { type: String, unique: true, sparse: true }, // Unique identifier for sharing
    sharedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }, // Original creator when copied
}, { timestamps: true });
// Generate a unique share ID when isShared is set to true
folderSchema.pre('save', function (next) {
    if (this.isShared && !this.shareId) {
        this.shareId = require('crypto').randomBytes(16).toString('hex');
    }
    next();
});
exports.default = (0, mongoose_1.model)('Folder', folderSchema);
