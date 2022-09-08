import auth from '../../auth.js';
import UserModel from '../../db/model/UserModel.js';

import { User } from './User.js';
import { IuserRegistrationInfo } from './interface.js';

import Validator from './UserValidator.js';
import Sanitize from './UserSanitizer.js';
import _ from 'lodash';

export class UserRegistrator implements IuserRegistrationInfo {
  public name: string;
  public email: string;
  public currency: string;
  public language: string;
  public password: string;

  constructor(info: IuserRegistrationInfo) {
    this.name = info.name;
    this.email = info.email;
    this.currency = info.currency;
    this.language = info.language;
    this.password = info.password;
    this.validate();
    this.sanizize();
  }

  async createUser(): Promise<User> {
    const newUserAuthId = await auth.createNewUserWithEmail(this.email, this.password);
    try {
      const userFromDB = await new UserModel({ ...this.getProfileInfo(), authId: newUserAuthId }).save();
      return new User({
        _id: userFromDB._id,
        name: userFromDB.name,
        email: userFromDB.email,
        authId: userFromDB.authId,
        budgets: userFromDB.budgets.toObject(),
        loans: userFromDB.loans.toObject(),
        currency: userFromDB.currency,
        language: userFromDB.language,
        subscription: userFromDB.subscription,
      });
    } catch (err) {
      await auth.deleteUserById(newUserAuthId);
      throw new Error('User saving failed... Reverting created firebase account.');
    }
  }

  getProfileInfo(): Omit<IuserRegistrationInfo, 'password'> {
    // Use to detach info from current UserRegistration instance
    return {
      name: this.name,
      email: this.email,
      currency: this.currency,
      language: this.language,
    };
  }

  validate(): UserRegistrator {
    if (!Validator.isValidName(this.name)) throw new Error('(validation) Name should contain value!');
    if (!Validator.isValidEmail(this.email)) throw new Error('(validation) Email value does not contain email!');
    if (!Validator.isValidCurrency(this.currency)) throw new Error('(validation) Name should be a currency value!');
    if (!Validator.isValidLanguage(this.language)) throw new Error('(validation) Language should be locale value!');

    return this;
  }
  sanizize(): UserRegistrator {
    this.name = Sanitize.name(this.name);
    this.email = Sanitize.email(this.email);
    this.currency = Sanitize.currency(this.currency);
    this.language = Sanitize.language(this.language);

    return this;
  }
  runtimeDataTypeCheck(): UserRegistrator {
    if (typeof this !== 'object' || this === null) throw new Error('Type of NewUserInput must be an object!');
    if (!_.isString(this.name)) throw new Error('Type of NewUserInput.name must be a string!');
    if (!_.isString(this.email)) throw new Error('Type of NewUserInput.email must be a string!');
    if (!_.isString(this.currency)) throw new Error('Type of NewUserInput.currency must be a string!');
    if (!_.isString(this.language)) throw new Error('Type of NewUserInput.language must be a string!');
    return this;
  }
}
