import { IUser, IUserInitializeInfo, IUserRegistrationInfo, IUserUpdateInfo } from './types/user/userInterface.js';
import {
  userRegistrationInfoHelpers,
  userHelpers,
  userUpdateInfoHelpers,
  userInitializeInfoHelpers,
} from './types/user/userHelpers.js';
import UserModel from './db/model/UserModel.js';
import auth from './auth.js';
import Budget from './budget.js';
import mongoose, { ClientSession } from 'mongoose';

// As a lender, I want to create a user account, so that I can persist changes.
export async function createUser(userRegistrationInfo: IUserRegistrationInfo): Promise<IUser> {
  userRegistrationInfoHelpers.runtimeCast(userRegistrationInfo);
  userRegistrationInfoHelpers.validateUserRegistrationInfo(userRegistrationInfo);
  userRegistrationInfoHelpers.sanitizeUserRegistrationInfo(userRegistrationInfo);

  try {
    const newUserAuthId = await auth.createNewUserWithEmail(userRegistrationInfo.email, userRegistrationInfo.password);

    try {
      const newUser = await new UserModel({ ...userRegistrationInfo, authId: newUserAuthId }).save();
      return userHelpers.runtimeCast({
        _id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        authId: newUser.authId,
        currency: newUser.currency,
        language: newUser.language,
        subscription: newUser.subscription,
      });
    } catch (err) {
      await auth.deleteUserByAuthId(newUserAuthId);
      throw new Error('User saving failed... Reverting created firebase account.');
    }
  } catch (err: any) {
    console.log(err);
    throw new Error(err.message);
  }
}

// As a lender, I want to create a user account, so that I can persist changes.
export async function initializeUser(
  userInitializeInfo: IUserInitializeInfo,
  initialBudgetName: string,
  initialBudgetDescription: string,
  initialBudgetFunds: number,
  initiaTransactionDescription: string,
): Promise<IUser> {
  userInitializeInfoHelpers.runtimeCast(userInitializeInfo);
  userInitializeInfoHelpers.validate(userInitializeInfo);
  userInitializeInfoHelpers.sanitize(userInitializeInfo);

  const session: ClientSession = await mongoose.connection.startSession();
  try {
    session.startTransaction();

    const newUser = await new UserModel(userInitializeInfo).save();
    await Budget.create(
      newUser._id.toString(),
      {
        name: initialBudgetName,
        description: initialBudgetDescription,
        defaultInterestRate: {
          type: 'FIXED_PER_DURATION',
          duration: 'FULL_DURATION',
          expectedPayments: 'ONE_TIME',
          amount: 0,
          isCompounding: false,
          entryTimestamp: new Date().getTime(),
        },
      },
      initialBudgetFunds,
      initiaTransactionDescription,
    );
    await session.commitTransaction();
    return userHelpers.runtimeCast({
      _id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      authId: newUser.authId,
      currency: newUser.currency,
      language: newUser.language,
      subscription: newUser.subscription,
    });
  } catch (err) {
    await session.abortTransaction();
    throw new Error('User saving failed...');
  } finally {
    session.endSession();
  }
}

// As a lender, I want to view my user account information, so that I can make appropriate changes.
export async function getUserByAuthId(authId: string): Promise<IUser | undefined> {
  try {
    const user = await UserModel.findOne({ authId: authId }).lean();
    if (user === null) throw new Error('User not found');
    return userHelpers.runtimeCast({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      authId: user.authId,
      currency: user.currency,
      language: user.language,
      subscription: user.subscription,
    });
  } catch (err) {
    if (err.message === 'User not found') throw new Error('User not found');
    throw new Error('User fetching failed...');
  }
}

export async function getUserById(id: string | object): Promise<IUser | undefined> {
  try {
    const user = await UserModel.findOne({ _id: id });
    if (user === null) throw new Error('User not found');
    return userHelpers.runtimeCast({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      authId: user.authId,
      currency: user.currency,
      language: user.language,
      subscription: user.subscription,
    });
  } catch (err) {
    throw new Error('User fetching failed...');
  }
}

// As a lender, I want to change my user account name, so that I can fix errors in spelling.
// As a lender, I want to change my subscription, so that I can pay for exactly what I need.
// As a lender, I want to change the UI language, so that I can more easily use the application.
export async function updateUserById(id: string | object, updatedUserInfo: IUserUpdateInfo): Promise<IUser> {
  userUpdateInfoHelpers.validateUserUpdateInfo(updatedUserInfo);
  userUpdateInfoHelpers.sanitizeUserUpdateInfo(updatedUserInfo);
  userUpdateInfoHelpers.runtimeCast(updatedUserInfo);

  try {
    const result = await UserModel.updateOne({ _id: id }, updatedUserInfo).exec();
    if (result.modifiedCount !== 1) throw new Error('Could not find user to update!');
    return await getUserById(id);
  } catch (err) {
    throw new Error('DB query error!');
  }
}

export async function checkIfExists(userId: string): Promise<void> {
  if (!(await UserModel.existsOneWithId(userId))) throw new Error('User does not exist!');
}
