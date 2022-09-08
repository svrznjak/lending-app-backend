import _ from 'lodash';

import UserModel from '../../db/model/UserModel.js';

import { IUser, IuserUpdateInfo } from './interface.js';
import { IBudget } from '../Budget/Interface.js';
import { ILoan } from '../interfaces/Loan.js';

import Sanitize from './UserSanitizer.js';
import Validator from './UserValidator.js';
import { Subscription } from '../Subscription/Subscription.js';
import { Budget } from '../Budget/Budget.js';

export class User implements IUser {
  public _id: object;
  public name: string;
  public email: string;
  public authId: string;
  public budgets: [IBudget?];
  public loans: [ILoan?];
  public currency: string;
  public language: string;
  public subscription: Subscription;

  constructor(user: IUser) {
    this._id = user._id;
    this.name = user.name;
    this.email = user.email;
    this.authId = user.authId;
    this.budgets = user.budgets;
    this.loans = user.loans;
    this.currency = user.currency;
    this.language = user.language;
    this.subscription = new Subscription(user.subscription);
  }

  detach(): IUser {
    // Detach info from current UserRegistration object
    return {
      _id: this._id,
      name: this.name,
      email: this.email,
      authId: this.authId,
      budgets: this.budgets,
      loans: this.loans,
      currency: this.currency,
      language: this.language,
      subscription: this.subscription.detach(),
    };
  }

  async updateUser(updateInformation: IuserUpdateInfo): Promise<User> {
    if (updateInformation.name !== undefined) {
      if (!Validator.isValidName(this.name)) throw new Error('(validation) Name should contain value!');

      updateInformation.name = Sanitize.name(updateInformation.name);
    }
    if (updateInformation.currency !== undefined) {
      if (!Validator.isValidCurrency(this.currency)) throw new Error('(validation) Name should be a currency value!');

      updateInformation.currency = Sanitize.currency(updateInformation.currency);
    }
    if (updateInformation.language !== undefined) {
      if (!Validator.isValidLanguage(this.language)) throw new Error('(validation) Language should be locale value!');

      updateInformation.language = Sanitize.language(updateInformation.language);
    }

    try {
      const result = await UserModel.updateOne({ _id: this._id }, updateInformation).exec();
      if (result.modifiedCount !== 1) throw new Error('Could not find user to update!');
    } catch (err) {
      throw new Error('DB query error!');
    }

    if (updateInformation.name !== undefined) this.name = updateInformation.name;
    if (updateInformation.currency !== undefined) this.currency = updateInformation.currency;
    if (updateInformation.language !== undefined) this.language = updateInformation.language;
    return this;
  }
  runtimeDataTypeCheck(): User {
    if (typeof this !== 'object' || this === null) throw new Error('Type of User must be an object!');
    if (typeof this._id !== 'object' || this._id === null) throw new Error('Type of User._id must be an object!');
    if (!_.isString(this.name)) throw new Error('Type of User.name must be a string!');
    if (!_.isString(this.email)) throw new Error('Type of User.email must be a string!');
    if (!_.isString(this.authId)) throw new Error('Type of User.authId must be a string!');
    if (!Array.isArray(this.budgets)) throw new Error('Type of User.budgets must be an Array!');
    if (!Array.isArray(this.loans)) throw new Error('Type of User.loans must be an Array!');
    if (!_.isString(this.currency)) throw new Error('Type of User.currency must be a string!');
    if (!_.isString(this.language)) throw new Error('Type of User.language must be a string!');
    this.subscription.runtimeDataTypeCheck();

    return this;
  }

  async addNewBudget(budget: Omit<IBudget, '_id'>): Promise<Budget> {
    try {
      const userFromDB = await UserModel.findOne({ _id: this._id });
      userFromDB.budgets.push(budget);
      await userFromDB.save();
      const newBudgetInDB = userFromDB.budgets[userFromDB.budgets.length - 1];

      const newBudget: Budget = new Budget({
        _id: newBudgetInDB._id,
        name: budget.name,
        description: budget.description,
        defaultInterestRate: budget.defaultInterestRate,
        calculatedTotalAmount: budget.calculatedTotalAmount,
        calculatedLendedAmount: budget.calculatedLendedAmount,
      });

      this.budgets.push(newBudget);
      return newBudget;
    } catch (err) {
      throw new Error('Budget saving failed.');
    }
  }
}

export async function instantiateUserFromUserId(id: string | object): Promise<User | undefined> {
  try {
    const result = await UserModel.findOne({ _id: id }).exec();
    if (!result) return undefined;
    return new User({
      _id: result._id,
      name: result.name,
      email: result.email,
      authId: result.authId,
      budgets: result.budgets.toObject(),
      loans: result.loans.toObject(),
      currency: result.currency,
      language: result.language,
      subscription: result.subscription,
    });
  } catch (err) {
    throw new Error('DB query error!');
  }
}

export async function instantiateUserFromUserAuthId(authId: string | object): Promise<User | undefined> {
  try {
    const result = await UserModel.findOne({ authId: authId }).exec();
    if (!result) return undefined;
    return new User({
      _id: result._id,
      name: result.name,
      email: result.email,
      authId: result.authId,
      budgets: result.budgets.toObject(),
      loans: result.loans.toObject(),
      currency: result.currency,
      language: result.language,
      subscription: result.subscription,
    });
  } catch (err) {
    throw new Error('DB query error!');
  }
}
