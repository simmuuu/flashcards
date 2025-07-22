
export const getNextReviewInterval = (difficulty: string, reviewCount: number): number => {
  // Base intervals in milliseconds
  const baseIntervals = {
    easy: [1000 * 60 * 10, 1000 * 60 * 60 * 4, 1000 * 60 * 60 * 24 * 3, 1000 * 60 * 60 * 24 * 8, 1000 * 60 * 60 * 24 * 20], // 10min, 4h, 3d, 8d, 20d
    medium: [1000 * 60 * 5, 1000 * 60 * 60 * 1, 1000 * 60 * 60 * 12, 1000 * 60 * 60 * 24 * 2, 1000 * 60 * 60 * 24 * 7], // 5min, 1h, 12h, 2d, 7d
    hard: [1000 * 60 * 1, 1000 * 60 * 10, 1000 * 60 * 60 * 2, 1000 * 60 * 60 * 8, 1000 * 60 * 60 * 24 * 2] // 1min, 10min, 2h, 8h, 2d
  };

  const intervals = baseIntervals[difficulty] || baseIntervals.medium;

  // For hard cards, reset review count occasionally to show them more often
  if (difficulty === 'hard' && reviewCount > 2 && Math.random() < 0.3) {
    return intervals[Math.max(0, reviewCount - 2)];
  }

  // For medium cards, occasionally show them again sooner
  if (difficulty === 'medium' && reviewCount > 1 && Math.random() < 0.2) {
    return intervals[Math.max(0, reviewCount - 1)];
  }

  return intervals[Math.min(reviewCount, intervals.length - 1)] || intervals[intervals.length - 1];
};
