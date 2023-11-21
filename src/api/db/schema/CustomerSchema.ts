import mongoose from 'mongoose';
import { NoteSchema } from './NoteSchema.js';

export default new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Users',
  },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  notes: { type: [NoteSchema], default: [], required: true },
  isArchived: { type: Boolean, default: false, required: true },
  entryTimestamp: { type: Number, required: true },
});
