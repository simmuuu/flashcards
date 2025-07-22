import { Request, Response } from 'express';
import Review from '../models/Review';

export const getHeatmapData = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const reviews = await Review.find({ user: userId });

    const heatmapData = reviews.reduce((acc: any, review: any) => {
      const date = review.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, count: 0 };
      }
      acc[date].count++;
      return acc;
    }, {});

    res.json(Object.values(heatmapData));
  } catch (err) {
    console.error('Error fetching heatmap data:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
