"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_1 = require("../controllers/ai");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = (0, express_1.Router)();
router.post('/generate-from-pdf', auth_1.default, ai_1.generateFromPdf);
exports.default = router;
