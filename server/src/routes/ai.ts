import { Router } from 'express';
import { generateFromPdf } from '../controllers/ai';
import isLoggedIn from '../middleware/auth';

const router = Router();

router.post('/generate-from-pdf', isLoggedIn, generateFromPdf);

export default router;
