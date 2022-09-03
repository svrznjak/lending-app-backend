import 'dotenv/config';
import mongoose from 'mongoose';

import initFirebase from './firebase/firebaseApp.js';
initFirebase();

try {
  await mongoose.connect(process.env.MONGO_URI);
} catch (err) {
  throw new Error('Failed to connect to MongoDB');
}

const testModel = mongoose.model(
  'test',
  new mongoose.Schema({
    text: { type: String, required: true },
  }),
);

await new testModel({ text: 'test' }).save();
