import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import auth from '../middleware/auth';
import Card from '../models/Card';
import Folder from '../models/Folder';
import { practice } from '../utils/sm2';

const router = Router();

// --- Get all cards for a folder ---
router.get('/:folderId', auth, async (req, res) => {
  try {
    // Ensure the folder belongs to the user
    const folder = await Folder.findOne({ _id: req.params.folderId, user: req.user.id });
    if (!folder) {
      return res.status(404).json({ msg: 'Folder not found' });
    }

    const cards = await Card.find({ folder: req.params.folderId }).sort({ nextReview: 1 });
    res.json(cards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- Create a new card ---
router.post(
  '/:folderId',
  [auth, [body('front', 'Front content is required').not().isEmpty(), body('back', 'Back content is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const folder = await Folder.findOne({ _id: req.params.folderId, user: req.user.id });
      if (!folder) {
        return res.status(404).json({ msg: 'Folder not found' });
      }

      const newCard = new Card({
        front: req.body.front,
        back: req.body.back,
        folder: req.params.folderId,
        user: req.user.id,
      });

      const card = await newCard.save();
      res.status(201).json(card);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// --- Review a card (practice) ---
router.put(
  '/review/:cardId',
  [auth, [body('quality', 'Quality rating (0-5) is required').isInt({ min: 0, max: 5 })]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let card = await Card.findOne({ _id: req.params.cardId, user: req.user.id });
      if (!card) {
        return res.status(404).json({ msg: 'Card not found' });
      }

      // Apply SM-2 algorithm
      card = practice(card, req.body.quality);

      await card.save();
      res.json(card);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

export default router;