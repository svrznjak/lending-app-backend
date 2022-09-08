//import mongoose from 'mongoose';
import { env } from 'process';

import { IUser, IuserRegistrationInfo, IuserUpdateInfo } from './types/User/interface.js';
import { User, instantiateUserFromUserAuthId, instantiateUserFromUserId } from './types/User/User.js';
import { UserRegistrator } from './types/User/UserRegistration.js';

// As a lender, I want to create a user account, so that I can persist changes.
export async function createUser(userRegistrationInfo: IuserRegistrationInfo): Promise<User> {
  const registrator: UserRegistrator = new UserRegistrator(userRegistrationInfo);
  if (env.DEV) registrator.runtimeDataTypeCheck();

  return await registrator.createUser();
}

// As a lender, I want to view my user account information, so that I can make appropriate changes.
export async function getUserByAuthId(authId: string): Promise<IUser | undefined> {
  return await instantiateUserFromUserAuthId(authId);
}

export async function getUserById(id: string | object): Promise<IUser | undefined> {
  return await instantiateUserFromUserId(id);
}

// As a lender, I want to change my user account name, so that I can fix errors in spelling.
// As a lender, I want to change my subscription, so that I can pay for exactly what I need.
// As a lender, I want to change the UI language, so that I can more easily use the application.
export async function updateUserById(id: string | object, updatedUserInfo: IuserUpdateInfo): Promise<IUser> {
  const user: User = await instantiateUserFromUserId(id);

  await user.updateUser(updatedUserInfo);

  return user.detach();
}
