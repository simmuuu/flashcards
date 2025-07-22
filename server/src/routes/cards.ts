import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import auth from '../middleware/auth';
import Card from '../models/Card';
import Folder from '../models/Folder';
import Review from '../models/Review';
import { practice } from '../utils/sm2';
import { sendDiscordWebhook } from '../utils/discordWebhook';

const router = Router();

// --- Get all cards for a folder ---
router.get('/:folderId', auth, async (req: Request<{ folderId: string }, any, any>, res: Response) => {
  try {
    const userReq = req as Request & { user?: { id: string } };
    if (!userReq.user) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }
    // Ensure the folder belongs to the user
    const folder = await Folder.findOne({ _id: req.params.folderId, user: userReq.user.id });
    if (!folder) {
      return res.status(404).json({ msg: 'Folder not found' });
    }

    const cards = await Card.find({ folder: req.params.folderId }).sort({ nextReview: 1 });
    res.json(cards);
  } catch (err) {
    let msg = 'Server error';
    if (err instanceof Error) {
      console.error(err.message);
      msg = err.message;
    } else {
      console.error(err);
      msg = String(err);
    }
    sendDiscordWebhook(`[Cards/Get] Error: ${msg}`);
    res.status(500).send('Server error');
  }
});

// --- Create a new card ---
router.post(
  '/:folderId',
  [
    auth,
    body('front', 'Front content is required').not().isEmpty(),
    body('back', 'Back content is required').not().isEmpty(),
  ],
  async (req: Request<{ folderId: string }, any, { front: string; back: string }>, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userReq = req as Request & { user?: { id: string } };
      if (!userReq.user) {
        return res.status(401).json({ msg: 'Unauthorized' });
      }
      const folder = await Folder.findOne({ _id: req.params.folderId, user: userReq.user.id });
      if (!folder) {
        return res.status(404).json({ msg: 'Folder not found' });
      }

      const newCard = new Card({
        front: req.body.front,
        back: req.body.back,
        folder: req.params.folderId,
        user: userReq.user.id,
      });

      const card = await newCard.save();
      res.status(201).json(card);
    } catch (err) {
      let msg = 'Server error';
      if (err instanceof Error) {
        console.error(err.message);
        msg = err.message;
      } else {
        console.error(err);
        msg = String(err);
      }
      sendDiscordWebhook(`[Cards/Create] Error: ${msg}`);
      res.status(500).send('Server error');
    }
  }
);

// --- Review a card (practice) ---
router.put(
  '/review/:cardId',
  [auth, body('quality', 'Quality rating (0-5) is required').isInt({ min: 0, max: 5 })],
  async (req: Request<{ cardId: string }, any, { quality: number }>, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userReq = req as Request & { user?: { id: string } };
      if (!userReq.user) {
        return res.status(401).json({ msg: 'Unauthorized' });
      }
      const card = await Card.findOne({ _id: req.params.cardId, user: userReq.user.id });
      if (!card) {
        return res.status(404).json({ msg: 'Card not found' });
      }

      // Apply SM-2 algorithm (mutates card)
      practice(card, req.body.quality);

      const review = new Review({
        user: userReq.user.id,
        card: card._id,
        quality: req.body.quality,
      });

      await review.save();
      await card.save();
      res.json(card);
    } catch (err) {
      let msg = 'Server error';
      if (err instanceof Error) {
        console.error(err.message);
        msg = err.message;
      } else {
        console.error(err);
        msg = String(err);
      }
      sendDiscordWebhook(`[Cards/Review] Error: ${msg}`);
      res.status(500).send('Server error');
    }
  }
);

export default router;
