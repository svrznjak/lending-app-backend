import mongoose from 'mongoose';
import auth from './auth.js';

import UserModel from './db/model/UserModel.js';
import { User, NewUserInput, UpdateUserInput } from './types/User/interface.js';
import { castToNewUserInput, castToUpdateUserInput, castToUser } from './types/User/user.js';

// As a lender, I want to create a user account, so that I can persist changes.
export async function createNewUser(newUserProfileInfo: any, password: string): Promise<User> {
  const newProfileInfo = castToNewUserInput(newUserProfileInfo).validate().sanizize();

  const newUserAuthId = await auth.createNewUserWithEmail(newProfileInfo.email, password);

  const newUser = new UserModel({
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
  } as User);
  try {
    await newUser.save();
    try {
      return castToUser(newUser);
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
    const user = castToUser(result);
    return user;
  } catch (err) {
    throw new Error('DB query error!');
  }
}

export async function getUserById(id: string | object): Promise<User | undefined> {
  try {
    const result = await UserModel.findOne({ _id: id }).exec();
    if (!result) return undefined;
    const user = castToUser(result);
    return user;
  } catch (err) {
    throw new Error('DB query error!');
  }
}

// As a lender, I want to change my user account name, so that I can fix errors in spelling.
// As a lender, I want to change my subscription, so that I can pay for exactly what I need.
// As a lender, I want to change the UI language, so that I can more easily use the application.
export async function updateUserById(id: string | object, updatedUserInfo: UpdateUserInput): Promise<User> {
  const checkedUpdatedUserInfo = castToUpdateUserInput(updatedUserInfo).validate().sanizize();

  try {
    const result = await UserModel.updateOne({ _id: id }, checkedUpdatedUserInfo).exec();
    if (result.modifiedCount !== 1) throw new Error('Could not find user to update!');
    const updatedUser = await getUserById(id);
    return updatedUser;
  } catch (err) {
    throw new Error('DB query error!');
  }
}
