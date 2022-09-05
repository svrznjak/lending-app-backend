import mongoose from 'mongoose';
import auth from './auth.js';

import UserModel from './db/model/UserModel.js';
import { User, NewUserInput, UpdateUserInput } from './types/interfaces/User.js';
import {
  castToNewUserInputAtRuntime,
  castToUpdateUserInputAtRuntime,
  castToUserAtRuntime,
} from './types/runtimeTypeCasters/user.js';
import { sanitizeNewUserInput, sanitizeUpdateUserInput } from './types/sanitizers/user.js';
import { validateNewUserInput, validateUpdateUserInput } from './types/validators/user.js';

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
export async function getUserByAuthId(authId: string): Promise<User | undefined> {
  try {
    const result = await UserModel.findOne({ authId: authId }).exec();
    if (!result) return undefined;
    const user = castToUserAtRuntime(result);
    return user;
  } catch (err) {
    throw new Error('DB query error!');
  }
}

export async function getUserById(id: string | object): Promise<User | undefined> {
  try {
    const result = await UserModel.findOne({ _id: id }).exec();
    if (!result) return undefined;
    const user = castToUserAtRuntime(result);
    return user;
  } catch (err) {
    throw new Error('DB query error!');
  }
}

// As a lender, I want to change my user account name, so that I can fix errors in spelling.
// As a lender, I want to change my subscription, so that I can pay for exactly what I need.
// As a lender, I want to change the UI language, so that I can more easily use the application.
export async function updateUserById(id: string | object, updatedUserInfo: UpdateUserInput): Promise<User> {
  const checkedUpdatedUserInfo = sanitizeUpdateUserInput(
    validateUpdateUserInput(castToUpdateUserInputAtRuntime(updatedUserInfo)),
  );
  try {
    const result = await UserModel.updateOne({ _id: id }, checkedUpdatedUserInfo).exec();
    if (result.modifiedCount !== 1) throw new Error('Could not find user to update!');
    const updatedUser = await getUserById(id);
    return updatedUser;
  } catch (err) {
    throw new Error('DB query error!');
  }
}
