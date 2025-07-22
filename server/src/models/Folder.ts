
import { Schema, model } from 'mongoose';

const folderSchema = new Schema({
  name: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export default model('Folder', folderSchema);
