import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/User';
import Folder from '../models/Folder';
import Card from '../models/Card';

// --- JWT Strategy (for protecting routes) ---
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET!,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.user.id);
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (err) {
      return done(err, false);
    }
  })
);

// --- Google OAuth Strategy ---
const googleOptions = {
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: '/api/auth/google/callback',
};

passport.use(
  new GoogleStrategy(googleOptions, async (accessToken, refreshToken, profile, done) => {
    const { id, displayName, emails } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      return done(new Error('Google account email not found'), false);
    }

    try {
      let user = await User.findOne({ email });

      if (user) {
        // If user exists, ensure Google ID is linked
        if (!user.googleId) {
          user.googleId = id;
          await user.save();
        }
        return done(null, user);
      } else {
        // If user does not exist, create a new one
        const newUser = new User({
          googleId: id,
          name: displayName,
          email,
        });
        await newUser.save();

        // Create a starter folder
        const starterFolder = new Folder({
          name: 'Starter',
          user: newUser.id,
        });
        await starterFolder.save();

        // Create a starter card
        const starterCard = new Card({
          front: 'Welcome to Flashcards!',
          back: 'This is a sample card to get you started.',
          folder: starterFolder.id,
          user: newUser.id,
        });
        await starterCard.save();

        return done(null, newUser);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);