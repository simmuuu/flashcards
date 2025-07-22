import { Schema, model, Document } from 'mongoose';

export interface IReview extends Document {
  user: Schema.Types.ObjectId;
  card: Schema.Types.ObjectId;
  quality: number;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  card: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
  quality: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default model<IReview>('Review', reviewSchema);
