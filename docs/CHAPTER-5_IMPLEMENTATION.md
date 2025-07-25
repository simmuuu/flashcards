# CHAPTER-5

## IMPLEMENTATION

### 5.1 Include sample code and technologies description

This section details the core technologies and provides sample code snippets illustrating key aspects of the Flashcards application's implementation.

#### Technologies Used

The application is built as a full-stack solution, comprising a React-based frontend and a Node.js/Express backend, both written in TypeScript. MongoDB is used as the primary database.

*   **Frontend:**
    *   **React:** A JavaScript library for building user interfaces. It allows for the creation of reusable UI components.
    *   **TypeScript:** A superset of JavaScript that adds static typing, enhancing code quality and maintainability.
    *   **Vite:** A fast build tool that provides a lightning-fast development experience for modern web projects.
    *   **React Router:** For declarative routing within the single-page application.
    *   **Axios:** A promise-based HTTP client for making requests to the backend API.
    *   **CSS:** For styling the application, with a focus on a clean and intuitive user interface.

*   **Backend:**
    *   **Node.js:** A JavaScript runtime built on Chrome's V8 JavaScript engine, used for building scalable network applications.
    *   **Express.js:** A fast, unopinionated, minimalist web framework for Node.js, used for building RESTful APIs.
    *   **TypeScript:** Provides type safety and better tooling for backend development.
    *   **MongoDB:** A NoSQL document database used for storing application data (users, folders, cards, reviews).
    *   **Mongoose:** An elegant MongoDB object modeling tool for Node.js, providing a schema-based solution to model application data.
    *   **Passport.js:** Authentication middleware for Node.js, used for user authentication strategies (e.g., JWT).
    *   **JSON Web Tokens (JWT):** For secure authentication and authorization between the client and server.
    *   **SM-2 Algorithm:** Implemented for the Spaced Repetition System, managing card review intervals based on user performance.

#### Sample Code

##### Frontend - Folder and Card Management (client/src/pages/HomePage.tsx)

The `HomePage.tsx` component is central to the user interface, handling the display of folders, cards within a folder, and the study mode. It demonstrates React's state management (`useState`, `useEffect`), routing (`useParams`, `useNavigate`), and interaction with the backend API.

```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Folder, Card } from '../types';
import api from '../services/api';
// ... other imports

export default function HomePage() {
  const { user, logout } = useAuth();
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyProgress, setStudyProgress] = useState<number[]>([]);
  // ... other states

  // Fetch folders on component mount or user change
  useEffect(() => {
    const fetchFolders = async () => {
      if (user) {
        try {
          const res = await api.get<Folder[]>('/folders');
          setFolders(res.data);
        } catch (err: any) {
          console.error('Error fetching folders:', err);
          if (err.response && err.response.status === 401) {
            logout();
          }
        }
      }
    };
    // ... fetch heatmap data
    fetchFolders();
    // ... fetchHeatmapData();
  }, [user, logout]);

  // ... other useEffects for folder/card fetching and study mode initialization

  const addNewFolder = () => {
    // ... dialog logic
  };

  const addNewCard = () => {
    // ... dialog logic
  };

  const handleDialogSave = async () => {
    if (dialogType === 'folder' && dialogData.name?.trim()) {
      try {
        const res = await api.post<Folder>('/folders', { name: dialogData.name.trim() });
        setFolders([...folders, res.data]);
        toast.success('Folder created successfully!');
      } catch (err) {
        console.error('Error creating folder:', err);
        toast.error('Failed to create folder');
      }
    }
    // ... card creation logic
    setShowDialog(false);
    setDialogData({});
  };

  // ... rest of the component logic for rendering folders, cards, and study mode
}
```

##### Backend - Folder Routes (server/src/routes/folders.ts)

The `folders.ts` file defines the API endpoints for managing flashcard folders. It showcases Express.js routing, middleware for authentication (`auth`), request validation (`express-validator`), and Mongoose for interacting with the MongoDB database.

```typescript
import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import auth from '../middleware/auth';
import Folder from '../models/Folder';
import Card from '../models/Card';
// ... other imports

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
    console.error(err?.message || String(err));
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
      console.error(err?.message || String(err));
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
    console.error(err?.message || String(err));
    res.status(500).send('Server error');
  }
});

// ... other routes for shared folders and folder deletion

export default router;
```

##### Backend - Folder Model (server/src/models/Folder.ts)

The `Folder.ts` file defines the Mongoose schema for the `Folder` model. It specifies the structure of folder documents in MongoDB, including fields for `name`, `user` (linking to the User model), `isShared`, and `shareId` for public sharing functionality. It also includes a pre-save hook to generate a unique `shareId` when a folder is marked as shared.

```typescript
import { Schema, model } from 'mongoose';

const folderSchema = new Schema(
  {
    name: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isShared: { type: Boolean, default: false },
    shareId: { type: String, unique: true, sparse: true }, // Unique identifier for sharing
    sharedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Original creator when copied
  },
  { timestamps: true }
);

// Generate a unique share ID when isShared is set to true
folderSchema.pre('save', function (next) {
  if (this.isShared && !this.shareId) {
    this.shareId = require('crypto').randomBytes(16).toString('hex');
  }
  next();
});

export default model('Folder', folderSchema);
```

##### Spaced Repetition System (SRS)

The application incorporates a Spaced Repetition System (SRS) based on the **SM-2 algorithm** to optimize learning. This algorithm dynamically adjusts the review intervals for flashcards based on the user's performance (how well they remember the card). Cards that are remembered easily will have longer intervals before their next review, while those that are difficult will be shown again sooner. The core logic for this is handled on the backend, updating card properties like `easinessFactor` and `nextReview` after each review session.
