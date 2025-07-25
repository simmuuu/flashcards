import { Schema, model } from 'mongoose';

const folderSchema = new Schema(
  {
    name: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isShared: { type: Boolean, default: false },
    shareId: { type: String, unique: true, sparse: true }, // Unique identifier for sharing
    sharedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Original creator when copied
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'completed',
    },
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
