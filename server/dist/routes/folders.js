"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = __importDefault(require("../middleware/auth"));
const Folder_1 = __importDefault(require("../models/Folder"));
const Card_1 = __importDefault(require("../models/Card"));
const discordWebhook_1 = require("../utils/discordWebhook");
const router = (0, express_1.Router)();
// --- Get all folders for a user ---
router.get('/', auth_1.default, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }
        const folders = await Folder_1.default.find({ user: req.user.id })
            .populate('sharedBy', 'name')
            .sort({ name: 1 });
        res.json(folders);
    }
    catch (err) {
        const msg = err?.message || String(err);
        console.error(msg);
        (0, discordWebhook_1.sendDiscordWebhook)(`[Folders/Get] Error: ${msg}`);
        res.status(500).send('Server error');
    }
});
// --- Get a single folder by ID ---
router.get('/:id', auth_1.default, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }
        const folder = await Folder_1.default.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        if (!folder) {
            return res.status(404).json({ msg: 'Folder not found' });
        }
        res.json(folder);
    }
    catch (err) {
        const msg = err?.message || String(err);
        console.error(msg);
        (0, discordWebhook_1.sendDiscordWebhook)(`[Folders/GetById] Error: ${msg}`);
        res.status(500).send('Server error');
    }
});
// --- Create a new folder ---
router.post('/', auth_1.default, [(0, express_validator_1.body)('name', 'Folder name is required').not().isEmpty().trim()], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        if (!req.user) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }
        const newFolder = new Folder_1.default({
            name: req.body.name,
            user: req.user.id,
        });
        const folder = await newFolder.save();
        res.status(201).json(folder);
    }
    catch (err) {
        const msg = err?.message || String(err);
        console.error(msg);
        (0, discordWebhook_1.sendDiscordWebhook)(`[Folders/Create] Error: ${msg}`);
        res.status(500).send('Server error');
    }
});
// --- Toggle folder sharing ---
router.patch('/:folderId/share', auth_1.default, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }
        const folder = await Folder_1.default.findOne({ _id: req.params.folderId, user: req.user.id });
        if (!folder) {
            return res.status(404).json({ msg: 'Folder not found' });
        }
        folder.isShared = !folder.isShared;
        if (!folder.isShared) {
            folder.shareId = undefined;
        }
        await folder.save();
        res.json(folder);
    }
    catch (err) {
        const msg = err?.message || String(err);
        console.error(msg);
        (0, discordWebhook_1.sendDiscordWebhook)(`[Folders/Share] Error: ${msg}`);
        res.status(500).send('Server error');
    }
});
// --- Get shared folder by shareId (public endpoint) ---
router.get('/shared/:shareId', async (req, res) => {
    try {
        const folder = await Folder_1.default.findOne({
            shareId: req.params.shareId,
            isShared: true,
        }).populate('user', 'name');
        if (!folder) {
            return res.status(404).json({ msg: 'Shared folder not found' });
        }
        // Get cards for this folder (without review data)
        const cards = await Card_1.default.find({ folder: folder._id }).select('front back');
        res.json({
            folder: {
                _id: folder._id,
                name: folder.name,
                createdBy: folder.user,
                createdAt: folder.createdAt,
            },
            cards,
        });
    }
    catch (err) {
        const msg = err?.message || String(err);
        console.error(msg);
        (0, discordWebhook_1.sendDiscordWebhook)(`[Folders/GetShared] Error: ${msg}`);
        res.status(500).send('Server error');
    }
});
// --- Copy shared folder to user's collection ---
router.post('/shared/:shareId/copy', auth_1.default, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }
        const sharedFolder = await Folder_1.default.findOne({
            shareId: req.params.shareId,
            isShared: true,
        }).populate('user', 'name');
        if (!sharedFolder) {
            return res.status(404).json({ msg: 'Shared folder not found' });
        }
        // Check if user already has this folder
        const existingFolder = await Folder_1.default.findOne({
            user: req.user.id,
            name: sharedFolder.name,
            sharedBy: sharedFolder.user._id,
        });
        if (existingFolder) {
            return res.status(400).json({ msg: 'You already have this folder' });
        }
        // Create new folder for the user
        const newFolder = new Folder_1.default({
            name: sharedFolder.name,
            user: req.user.id,
            sharedBy: sharedFolder.user._id,
            isShared: false,
        });
        const savedFolder = await newFolder.save();
        // Copy cards from shared folder (reset review data)
        const sharedCards = await Card_1.default.find({ folder: sharedFolder._id });
        const newCards = sharedCards.map(card => ({
            front: card.front,
            back: card.back,
            folder: savedFolder._id,
            nextReview: new Date(),
            easinessFactor: 2.5,
        }));
        await Card_1.default.insertMany(newCards);
        const populatedFolder = await Folder_1.default.findById(savedFolder._id).populate('sharedBy', 'name');
        res.status(201).json(populatedFolder);
    }
    catch (err) {
        const msg = err?.message || String(err);
        console.error(msg);
        (0, discordWebhook_1.sendDiscordWebhook)(`[Folders/Copy] Error: ${msg}`);
        res.status(500).send('Server error');
    }
});
// --- Delete a folder and its cards ---
router.delete('/:folderId', auth_1.default, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }
        const folder = await Folder_1.default.findOne({ _id: req.params.folderId, user: req.user.id });
        if (!folder) {
            return res.status(404).json({ msg: 'Folder not found' });
        }
        // Delete all cards within the folder
        await Card_1.default.deleteMany({ folder: folder._id });
        // Delete the folder itself
        await folder.deleteOne();
        res.json({ msg: 'Folder and all its cards have been deleted.' });
    }
    catch (err) {
        const msg = err?.message || String(err);
        console.error(msg);
        (0, discordWebhook_1.sendDiscordWebhook)(`[Folders/Delete] Error: ${msg}`);
        res.status(500).send('Server error');
    }
});
exports.default = router;
