"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHeatmapData = void 0;
const Review_1 = __importDefault(require("../models/Review"));
const getHeatmapData = async (req, res) => {
    try {
        const userId = req.user.id;
        const reviews = await Review_1.default.find({ user: userId });
        const heatmapData = reviews.reduce((acc, review) => {
            const date = review.createdAt.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { date, count: 0 };
            }
            acc[date].count++;
            return acc;
        }, {});
        res.json(Object.values(heatmapData));
    }
    catch (err) {
        console.error('Error fetching heatmap data:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getHeatmapData = getHeatmapData;
