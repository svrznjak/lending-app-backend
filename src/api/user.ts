import mongoose from 'mongoose';

import UserModel from './db/model/UserModel.js';
import {
  User,
  NewUserInput,
  UpdateUserInput,
} from './types/interfaces/User.js';

// As a lender, I want to create a user account, so that I can persist changes.
export async function createNewUser(newUserInfo: NewUserInput): Promise<User> {
  throw new Error('Function not implemented');
}

// As a lender, I want to view my user account information, so that I can make appropriate changes.
export async function getUserById(id: object): Promise<User> {
  throw new Error('Function not implemented');
}

// As a lender, I want to change my user account name, so that I can fix errors in spelling.
// As a lender, I want to change my subscription, so that I can pay for exactly what I need.
// As a lender, I want to change the UI language, so that I can more easily use the application.
export async function updateUserById(
  updatedUserInfo: UpdateUserInput,
): Promise<User> {
  throw new Error('Function not implemented');
}

// example function

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
    subscription: {
      revenuecatId: 'xxx',
      type: 'FREE',
    },
  };

  const newUser = new UserModel(newUserData);
  await newUser.save();
  return true;
}
