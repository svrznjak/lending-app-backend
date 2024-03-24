import { IUser, IUserInitializeInfo, IUserUpdateInfo } from './types/user/userInterface.js';
import { userHelpers, userUpdateInfoHelpers, userInitializeInfoHelpers } from './types/user/userHelpers.js';
import UserModel from './db/model/UserModel.js';
import Budget from './budget.js';

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

  try {
    const newUser = await new UserModel(userInitializeInfo).save();
    await Budget.create(
      newUser._id.toString(),
      {
        name: initialBudgetName,
        description: initialBudgetDescription,
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'YEAR',
          amount: 5,
          isCompounding: false,
          entryTimestamp: Date.now(),
        },
        defaultPaymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '31',
          entryTimestamp: Date.now(),
        },
      },
      initialBudgetFunds,
      initiaTransactionDescription,
    );
    return userHelpers.runtimeCast({
      _id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      authId: newUser.authId,
      currency: newUser.currency,
      language: newUser.language,
      formattingLocale: newUser.formattingLocale,
      subscription: newUser.subscription,
      notificationTokens: newUser.notificationTokens,
    });
  } catch (err) {
    throw new Error('User saving failed...');
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
      formattingLocale: user.formattingLocale,
      subscription: user.subscription,
      notificationTokens: user.notificationTokens,
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
      formattingLocale: user.formattingLocale,
      subscription: user.subscription,
      notificationTokens: user.notificationTokens,
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

// As a user, i want to add notification tokens to my account, so that i can receive notifications.
export async function addNotificationToken(userId: string, notificationToken: string): Promise<IUser> {
  try {
    const result = await UserModel.updateOne(
      { _id: userId },
      { $addToSet: { notificationTokens: notificationToken } },
    ).exec();
    if (result.modifiedCount !== 1) throw new Error('Could not find user to update!');
    return await getUserById(userId);
  } catch (err) {
    throw new Error('DB query error!');
  }
}

// As a user, i want to remove notification tokens from my account, so that i can stop receiving notifications.
export async function removeNotificationToken(userId: string, notificationToken: string): Promise<IUser> {
  try {
    const result = await UserModel.updateOne(
      { _id: userId },
      { $pull: { notificationTokens: notificationToken } },
    ).exec();
    if (result.modifiedCount !== 1) throw new Error('Could not find user to update!');
    return await getUserById(userId);
  } catch (err) {
    throw new Error('DB query error!');
  }
}

export async function checkIfExists(userId: string): Promise<void> {
  if (!(await UserModel.existsOneWithId(userId))) throw new Error('User does not exist!');
}
