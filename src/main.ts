import 'dotenv/config';
import mongoose from 'mongoose';

import initFirebase from './firebase/firebaseApp.js';
initFirebase();

import { createNewUserTest } from './api/User.js';

try {
  await mongoose.connect(process.env.MONGO_URI);
} catch (err) {
  throw new Error('Failed to connect to MongoDB');
}

console.log(await createNewUserTest());
