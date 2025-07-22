import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import auth from '../middleware/auth';
import Folder from '../models/Folder';
import Card from '../models/Card';

const router = Router();

// --- Get all folders for a user ---
router.get('/', auth, async (req, res) => {
  try {
    const folders = await Folder.find({ user: req.user.id }).sort({ name: 1 });
    res.json(folders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- Create a new folder ---
router.post('/', [auth, [body('name', 'Folder name is required').not().isEmpty().trim()]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const newFolder = new Folder({
      name: req.body.name,
      user: req.user.id,
    });

    const folder = await newFolder.save();
    res.status(201).json(folder);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- Delete a folder and its cards ---
router.delete('/:folderId', auth, async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.folderId, user: req.user.id });
    if (!folder) {
      return res.status(404).json({ msg: 'Folder not found' });
    }

    // Delete all cards within the folder
    await Card.deleteMany({ folder: folder._id });

    // Delete the folder itself
    await folder.deleteOne();

    res.json({ msg: 'Folder and all its cards have been deleted.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
