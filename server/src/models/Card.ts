import { Schema, model, Document } from 'mongoose';

export interface ICard extends Document {
  front: string;
  back: string;
  easinessFactor: number;
  repetitions: number;
  interval: number;
  nextReview: Date;
  folder: Schema.Types.ObjectId;
  user: Schema.Types.ObjectId;
}

const cardSchema = new Schema<ICard>(
  {
    front: { type: String, required: true, trim: true },
    back: { type: String, required: true, trim: true },
    easinessFactor: { type: Number, default: 2.5 },
    repetitions: { type: Number, default: 0 },
    interval: { type: Number, default: 0 }, // in days
    nextReview: { type: Date, default: () => new Date() },
    folder: { type: Schema.Types.ObjectId, ref: 'Folder', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default model<ICard>('Card', cardSchema);