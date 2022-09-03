import mongoose from 'mongoose';

import UserModel from './db/model/UserModel.js';
import { User } from './interfaces/User.js';

export async function createNewUserTest(): Promise<boolean> {
  const newUserData: User = {
    _id: new mongoose.Types.ObjectId(),
    name: 'test name',
    email: 'test@gmail.com',
    firebaseId: 'xxx',
    budgets: [],
    loans: [],
    currency: 'string',
    language: 'string',
    timezone: 'string',
    subscription: {
      revenuecatId: 'xxx',
      type: 'FREE',
    },
  };

  const newUser = new UserModel(newUserData);
  await newUser.save();
  return true;
}
