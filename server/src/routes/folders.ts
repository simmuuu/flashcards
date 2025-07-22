import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import auth from '../middleware/auth';
import Folder from '../models/Folder';
import Card from '../models/Card';
import User from '../models/User';
import { sendDiscordWebhook } from '../utils/discordWebhook';

const router = Router();

// --- Get all folders for a user ---
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }
    const folders = await Folder.find({ user: (req.user as any).id })
      .populate('sharedBy', 'name')
      .sort({ name: 1 });
    res.json(folders);
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error(msg);
    sendDiscordWebhook(`[Folders/Get] Error: ${msg}`);
    res.status(500).send('Server error');
  }
});

// --- Create a new folder ---
router.post(
  '/',
  auth,
  [body('name', 'Folder name is required').not().isEmpty().trim()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      if (!req.user) {
        return res.status(401).json({ msg: 'Unauthorized' });
      }

      const newFolder = new Folder({
        name: req.body.name,
        user: (req.user as any).id,
      });

      const folder = await newFolder.save();
      res.status(201).json(folder);
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error(msg);
      sendDiscordWebhook(`[Folders/Create] Error: ${msg}`);
      res.status(500).send('Server error');
    }
  }
);

// --- Toggle folder sharing ---
router.patch('/:folderId/share', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const folder = await Folder.findOne({ _id: req.params.folderId, user: (req.user as any).id });
    if (!folder) {
      return res.status(404).json({ msg: 'Folder not found' });
    }

    folder.isShared = !folder.isShared;
    if (!folder.isShared) {
      folder.shareId = undefined;
    }

    await folder.save();
    res.json(folder);
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error(msg);
    sendDiscordWebhook(`[Folders/Share] Error: ${msg}`);
    res.status(500).send('Server error');
  }
});

// --- Get shared folder by shareId (public endpoint) ---
router.get('/shared/:shareId', async (req: Request, res: Response) => {
  try {
    const folder = await Folder.findOne({
      shareId: req.params.shareId,
      isShared: true,
    }).populate('user', 'name');

    if (!folder) {
      return res.status(404).json({ msg: 'Shared folder not found' });
    }

    // Get cards for this folder (without review data)
    const cards = await Card.find({ folder: folder._id }).select('front back');

    res.json({
      folder: {
        _id: folder._id,
        name: folder.name,
        createdBy: folder.user,
        createdAt: folder.createdAt,
      },
      cards,
    });
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error(msg);
    sendDiscordWebhook(`[Folders/GetShared] Error: ${msg}`);
    res.status(500).send('Server error');
  }
});

// --- Copy shared folder to user's collection ---
router.post('/shared/:shareId/copy', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const sharedFolder = await Folder.findOne({
      shareId: req.params.shareId,
      isShared: true,
    }).populate('user', 'name');

    if (!sharedFolder) {
      return res.status(404).json({ msg: 'Shared folder not found' });
    }

    // Check if user already has this folder
    const existingFolder = await Folder.findOne({
      user: (req.user as any).id,
      name: sharedFolder.name,
      sharedBy: (sharedFolder.user as any)._id,
    });

    if (existingFolder) {
      return res.status(400).json({ msg: 'You already have this folder' });
    }

    // Create new folder for the user
    const newFolder = new Folder({
      name: sharedFolder.name,
      user: (req.user as any).id,
      sharedBy: (sharedFolder.user as any)._id,
      isShared: false,
    });

    const savedFolder = await newFolder.save();

    // Copy cards from shared folder (reset review data)
    const sharedCards = await Card.find({ folder: sharedFolder._id });
    const newCards = sharedCards.map(card => ({
      front: card.front,
      back: card.back,
      folder: savedFolder._id,
      nextReview: new Date(),
      easinessFactor: 2.5,
    }));

    await Card.insertMany(newCards);

    const populatedFolder = await Folder.findById(savedFolder._id).populate('sharedBy', 'name');
    res.status(201).json(populatedFolder);
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error(msg);
    sendDiscordWebhook(`[Folders/Copy] Error: ${msg}`);
    res.status(500).send('Server error');
  }
});

// --- Delete a folder and its cards ---
router.delete('/:folderId', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const folder = await Folder.findOne({ _id: req.params.folderId, user: (req.user as any).id });
    if (!folder) {
      return res.status(404).json({ msg: 'Folder not found' });
    }

    // Delete all cards within the folder
    await Card.deleteMany({ folder: folder._id });

    // Delete the folder itself
    await folder.deleteOne();

    res.json({ msg: 'Folder and all its cards have been deleted.' });
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error(msg);
    sendDiscordWebhook(`[Folders/Delete] Error: ${msg}`);
    res.status(500).send('Server error');
  }
});

export default router;
