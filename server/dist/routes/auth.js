"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const discordWebhook_1 = require("../utils/discordWebhook");
const express_validator_1 = require("express-validator");
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Folder_1 = __importDefault(require("../models/Folder"));
const Card_1 = __importDefault(require("../models/Card"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = (0, express_1.Router)();
// --- Helper to create JWT ---
const createToken = (userId) => {
    const payload = { user: { id: userId } };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};
// --- Register a new user ---
router.post('/register', [
    (0, express_validator_1.body)('name', 'Name is required').not().isEmpty(),
    (0, express_validator_1.body)('email', 'Please include a valid email').isEmail(),
    (0, express_validator_1.body)('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    try {
        let user = await User_1.default.findOne({ email });
        if (user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
        }
        user = new User_1.default({ name, email, password });
        await user.save();
        // Create a starter folder
        const starterFolder = new Folder_1.default({
            name: 'Starter',
            user: user.id,
        });
        await starterFolder.save();
        // Create a starter card
        const starterCard = new Card_1.default({
            front: 'Welcome to Flashcards!',
            back: 'This is a sample card to get you started.',
            folder: starterFolder.id,
            user: user.id,
        });
        await starterCard.save();
        const token = createToken(user.id);
        res.status(201).json({ token });
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
        (0, discordWebhook_1.sendDiscordWebhook)(`[Auth/Register] Error: ${msg}`);
        res.status(500).send('Server error');
    }
});
// --- Login a user ---
router.post('/login', [(0, express_validator_1.body)('email', 'Please include a valid email').isEmail(), (0, express_validator_1.body)('password', 'Password is required').exists()], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
        }
        const token = createToken(user.id);
        res.json({ token });
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
        (0, discordWebhook_1.sendDiscordWebhook)(`[Auth/Login] Error: ${msg}`);
        res.status(500).send('Server error');
    }
});
// --- Get authenticated user ---
router.get('/me', auth_1.default, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }
        const user = await User_1.default.findById(req.user.id);
        res.json(user);
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
        (0, discordWebhook_1.sendDiscordWebhook)(`[Auth/Me] Error: ${msg}`);
        res.status(500).send('Server error');
    }
    // .env: DISCORD_WEBHOOK_URL=your_webhook_url_here
});
// --- Google OAuth ---
router.get('/google', (req, res, next) => {
    const prompt = req.query.prompt;
    const access_type = req.query.access_type;
    const authOptions = { scope: ['profile', 'email'] };
    if (prompt) {
        authOptions.prompt = prompt;
    }
    if (access_type) {
        authOptions.accessType = access_type;
    }
    passport_1.default.authenticate('google', authOptions)(req, res, next);
});
router.get('/google/callback', passport_1.default.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?error=google_auth_failed`,
}), (req, res) => {
    if (!req.user) {
        return res.status(401).json({ msg: 'Unauthorized' });
    }
    const token = createToken(req.user._id || req.user.id);
    // Simple redirect to auth callback
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
});
exports.default = router;
