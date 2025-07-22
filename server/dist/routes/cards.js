"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = __importDefault(require("../middleware/auth"));
const Card_1 = __importDefault(require("../models/Card"));
const Folder_1 = __importDefault(require("../models/Folder"));
const Review_1 = __importDefault(require("../models/Review"));
const sm2_1 = require("../utils/sm2");
const discordWebhook_1 = require("../utils/discordWebhook");
const router = (0, express_1.Router)();
// --- Get all cards for a folder ---
router.get('/:folderId', auth_1.default, async (req, res) => {
    try {
        const userReq = req;
        if (!userReq.user) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }
        // Ensure the folder belongs to the user
        const folder = await Folder_1.default.findOne({ _id: req.params.folderId, user: userReq.user.id });
        if (!folder) {
            return res.status(404).json({ msg: 'Folder not found' });
        }
        const cards = await Card_1.default.find({ folder: req.params.folderId }).sort({ nextReview: 1 });
        res.json(cards);
    }
    catch (err) {
        let msg = 'Server error';
        if (err instanceof Error) {
            console.error(err.message);
            msg = err.message;
        }
        else {
            console.error(err);
            msg = String(err);
        }
        (0, discordWebhook_1.sendDiscordWebhook)(`[Cards/Get] Error: ${msg}`);
        res.status(500).send('Server error');
    }
});
// --- Create a new card ---
router.post('/:folderId', [
    auth_1.default,
    (0, express_validator_1.body)('front', 'Front content is required').not().isEmpty(),
    (0, express_validator_1.body)('back', 'Back content is required').not().isEmpty(),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const userReq = req;
        if (!userReq.user) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }
        const folder = await Folder_1.default.findOne({ _id: req.params.folderId, user: userReq.user.id });
        if (!folder) {
            return res.status(404).json({ msg: 'Folder not found' });
        }
        const newCard = new Card_1.default({
            front: req.body.front,
            back: req.body.back,
            folder: req.params.folderId,
            user: userReq.user.id,
        });
        const card = await newCard.save();
        res.status(201).json(card);
    }
    catch (err) {
        let msg = 'Server error';
        if (err instanceof Error) {
            console.error(err.message);
            msg = err.message;
        }
        else {
            console.error(err);
            msg = String(err);
        }
        (0, discordWebhook_1.sendDiscordWebhook)(`[Cards/Create] Error: ${msg}`);
        res.status(500).send('Server error');
    }
});
// --- Review a card (practice) ---
router.put('/review/:cardId', [auth_1.default, (0, express_validator_1.body)('quality', 'Quality rating (0-5) is required').isInt({ min: 0, max: 5 })], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const userReq = req;
        if (!userReq.user) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }
        const card = await Card_1.default.findOne({ _id: req.params.cardId, user: userReq.user.id });
        if (!card) {
            return res.status(404).json({ msg: 'Card not found' });
        }
        // Apply SM-2 algorithm (mutates card)
        (0, sm2_1.practice)(card, req.body.quality);
        const review = new Review_1.default({
            user: userReq.user.id,
            card: card._id,
            quality: req.body.quality,
        });
        await review.save();
        await card.save();
        res.json(card);
    }
    catch (err) {
        let msg = 'Server error';
        if (err instanceof Error) {
            console.error(err.message);
            msg = err.message;
        }
        else {
            console.error(err);
            msg = String(err);
        }
        (0, discordWebhook_1.sendDiscordWebhook)(`[Cards/Review] Error: ${msg}`);
        res.status(500).send('Server error');
    }
});
exports.default = router;
