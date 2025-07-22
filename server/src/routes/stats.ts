import express from 'express';
import passport from 'passport';
import { getHeatmapData } from '../controllers/stats';

const router = express.Router();

router.get(
  '/heatmap',
  passport.authenticate('jwt', { session: false }),
  getHeatmapData
);

export default router;
