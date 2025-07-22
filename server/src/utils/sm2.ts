
import { ICard } from '../models/Card';

/**
 * Updates a card's review data based on the SM-2 algorithm.
 * @param card The card to update.
 * @param quality The quality of the user's response (0-5).
 * @returns The updated card object with new review parameters.
 */
export const practice = (card: ICard, quality: number): ICard => {
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5.');
  }

  if (quality < 3) {
    // If response quality is low, reset repetitions and start over.
    card.repetitions = 0;
    card.interval = 1; // Reset interval to 1 day
  } else {
    // Update Easiness Factor (EF)
    const newEasinessFactor = card.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    card.easinessFactor = Math.max(1.3, newEasinessFactor); // EF cannot be less than 1.3

    card.repetitions += 1;

    // Calculate new interval
    if (card.repetitions === 1) {
      card.interval = 1;
    } else if (card.repetitions === 2) {
      card.interval = 6;
    } else {
      card.interval = Math.ceil(card.interval * card.easinessFactor);
    }
  }

  // Set the next review date
  const now = new Date();
  now.setDate(now.getDate() + card.interval);
  card.nextReview = now;

  return card;
};
