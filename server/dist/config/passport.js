"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_jwt_1 = require("passport-jwt");
const User_1 = __importDefault(require("../models/User"));
const Folder_1 = __importDefault(require("../models/Folder"));
const Card_1 = __importDefault(require("../models/Card"));
// --- JWT Strategy (for protecting routes) ---
const jwtOptions = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
};
passport_1.default.use(new passport_jwt_1.Strategy(jwtOptions, async (payload, done) => {
    try {
        const user = await User_1.default.findById(payload.user.id);
        if (user) {
            return done(null, user);
        }
        return done(null, false);
    }
    catch (err) {
        return done(err, false);
    }
}));
// --- Google OAuth Strategy ---
const googleOptions = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://flashcards-api.simmu.me/api/auth/google/callback',
};
passport_1.default.use(new passport_google_oauth20_1.Strategy(googleOptions, async (accessToken, refreshToken, profile, done) => {
    const { id, displayName, emails } = profile;
    const email = emails?.[0]?.value;
    if (!email) {
        return done(new Error('Google account email not found'), false);
    }
    try {
        let user = await User_1.default.findOne({ email });
        if (user) {
            // If user exists, ensure Google ID is linked
            if (!user.googleId) {
                user.googleId = id;
                await user.save();
            }
            return done(null, user);
        }
        else {
            // If user does not exist, create a new one
            const newUser = new User_1.default({
                googleId: id,
                name: displayName,
                email,
            });
            await newUser.save();
            // Create a starter folder
            const starterFolder = new Folder_1.default({
                name: 'Starter',
                user: newUser.id,
            });
            await starterFolder.save();
            // Create a starter card
            const starterCard = new Card_1.default({
                front: 'Welcome to Flashcards!',
                back: 'This is a sample card to get you started.',
                folder: starterFolder.id,
                user: newUser.id,
            });
            await starterCard.save();
            return done(null, newUser);
        }
    }
    catch (err) {
        return done(err, false);
    }
}));
