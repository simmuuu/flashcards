import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Folder from '../models/Folder';
import Card from '../models/Card';
import auth from '../middleware/auth';

const router = Router();

// --- Helper to create JWT ---
const createToken = (userId: string) => {
  const payload = { user: { id: userId } };
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

// --- Register a new user ---
router.post(
  '/register',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({ name, email, password });
      await user.save();

      // Create a starter folder
      const starterFolder = new Folder({
        name: 'Starter',
        user: user.id,
      });
      await starterFolder.save();

      // Create a starter card
      const starterCard = new Card({
        front: 'Welcome to Flashcards!',
        back: 'This is a sample card to get you started.',
        folder: starterFolder.id,
        user: user.id,
      });
      await starterCard.save();

      const token = createToken(user.id);
      res.status(201).json({ token });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// --- Login a user ---
router.post(
  '/login',
  [body('email', 'Please include a valid email').isEmail(), body('password', 'Password is required').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const token = createToken(user.id);
      res.json({ token });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// --- Get authenticated user ---
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- Google OAuth ---
router.get('/google', (req, res, next) => {
  const prompt = req.query.prompt as string;
  const access_type = req.query.access_type as string;

  const authOptions: any = { scope: ['profile', 'email'] };

  if (prompt) {
    authOptions.prompt = prompt;
  }

  if (access_type) {
    authOptions.accessType = access_type;
  }

  passport.authenticate('google', authOptions)(req, res, next);
});

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: 'http://192.168.0.4:3000/auth?error=google_auth_failed',
  }),
  (req, res) => {
    const token = createToken(req.user.id);
    // Simple redirect to auth callback
    res.redirect(`http://192.168.0.4:3000/auth/callback?token=${token}`);
  }
);

export default router;
