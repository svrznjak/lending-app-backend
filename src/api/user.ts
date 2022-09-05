import mongoose from 'mongoose';
import auth from './auth.js';

import UserModel from './db/model/UserModel.js';
import { User, NewUserInput, UpdateUserInput } from './types/interfaces/User.js';
import { castToNewUserInputAtRuntime, castToUserAtRuntime } from './types/runtimeTypeCasters/user.js';
import { sanitizeNewUserInput } from './types/sanitizers/user.js';
import { validateNewUserInput } from './types/validators/user.js';

// As a lender, I want to create a user account, so that I can persist changes.
export async function createNewUser(newUserProfileInfo: NewUserInput, password: string): Promise<User> {
  const castedNewUserProfileInfo = castToNewUserInputAtRuntime(newUserProfileInfo);
  const validatedNewUserProfileInfo = validateNewUserInput(castedNewUserProfileInfo);
  const newProfileInfo = sanitizeNewUserInput(validatedNewUserProfileInfo);

  const newUserAuthId = await auth.createNewUserWithEmail(newProfileInfo.email, password);

  const newUserData: User = {
    _id: new mongoose.Types.ObjectId(),
    name: newProfileInfo.name,
    email: newProfileInfo.email,
    authId: newUserAuthId,
    budgets: [],
    loans: [],
    currency: newProfileInfo.currency,
    language: newProfileInfo.language,
    subscription: {
      revenuecatId: '',
      type: 'FREE',
    },
  };

  const newUser = new UserModel(newUserData);
  try {
    const savedNewUser = await newUser.save();
    try {
      return castToUserAtRuntime(savedNewUser);
    } catch (err) {
      //report error to admin
      console.log(err);
      auth.deleteUserById(newUserAuthId);
      newUser.remove();
      throw new Error('User saving failed. Error was sent to admin.');
    }
  } catch (err) {
    auth.deleteUserById(newUserAuthId);
    throw new Error('User saving failed... Reverting firebase created account.');
  }
}

// As a lender, I want to view my user account information, so that I can make appropriate changes.
export async function getUserById(id: object): Promise<User> {
  console.log(id);
  throw new Error('Function not implemented');
}

// As a lender, I want to change my user account name, so that I can fix errors in spelling.
// As a lender, I want to change my subscription, so that I can pay for exactly what I need.
// As a lender, I want to change the UI language, so that I can more easily use the application.
export async function updateUserById(updatedUserInfo: UpdateUserInput): Promise<User> {
  console.log(updatedUserInfo);

  throw new Error('Function not implemented');
}

// example function

export async function createNewUserTest(): Promise<boolean> {
  const newUserData: User = {
    _id: new mongoose.Types.ObjectId(),
    name: 'test name',
    email: 'test@gmail.com',
    authId: 'xxx',
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
