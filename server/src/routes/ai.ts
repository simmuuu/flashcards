import { Router, Request, Response, NextFunction } from 'express';
import { generateFromPdf, upload } from '../controllers/ai';
import isLoggedIn from '../middleware/auth';

const router = Router();

// Custom error handler for multer errors
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size must be less than 5MB' });
    }
    if (err.message === 'Only PDF files are allowed') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }
    return res.status(400).json({ error: 'File upload error' });
  }
  next();
};

router.post('/generate-from-pdf', isLoggedIn, upload.single('pdf'), handleMulterError, generateFromPdf);

export default router;
