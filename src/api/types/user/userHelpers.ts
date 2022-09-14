//import { subscriptionHelpers } from '../subscription/subscriptionHelpers.js';
import { IUser, IUserRegistrationInfo, IUserUpdateInfo } from './userInterface.js';
import Validator from './userValidator.js';
import Sanitize from './userSanitizer.js';
import _ from 'lodash';
import { subscriptionHelpers } from '../subscription/subscriptionHelpers.js';

export const userHelpers = {
  validateUser: function validateUser(user: IUser): IUser {
    // Validate is currently not implemented on userHelpers, because this helper is currently only used as output from database.
    throw new Error('Function not implemented!');
    return user;
  },
  sanitizeUser: function sanitizeUser(user: IUser): IUser {
    // Sanitize is currently not implemented on userHelpers, because this helper is currently only used as output from database.
    throw new Error('Function not implemented!');
    return user;
  },
  runtimeCast: function runtimeCast(user: any): IUser {
    if (typeof user !== 'object' || user === null) throw new Error('Type of User must be an object!');
    if (!_.isString(user._id)) throw new Error('Type of User._id must be a string!');
    if (!_.isString(user.name)) throw new Error('Type of User.name must be a string!');
    if (!_.isString(user.email)) throw new Error('Type of User.email must be a string!');
    if (!_.isString(user.authId)) throw new Error('Type of User.authId must be a string!');
    if (!Array.isArray(user.budgets)) throw new Error('Type of User.budgets must be an Array!');
    if (!Array.isArray(user.loans)) throw new Error('Type of User.loans must be an Array!');
    if (!_.isString(user.currency)) throw new Error('Type of User.currency must be a string!');
    if (!_.isString(user.language)) throw new Error('Type of User.language must be a string!');

    subscriptionHelpers.runtimeCast(user.subscription);

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      authId: user.authId,
      budgets: user.budgets,
      loans: user.loans,
      currency: user.currency,
      language: user.language,
      subscription: user.subscription,
    };
  },
};

export const userRegistrationInfoHelpers = {
  validateUserRegistrationInfo: function validateUserRegistrationInfo(
    registrationInfo: IUserRegistrationInfo,
  ): IUserRegistrationInfo {
    if (!Validator.isValidName(registrationInfo.name)) throw new Error('(validation) Name should contain value!');
    if (!Validator.isValidEmail(registrationInfo.email))
      throw new Error('(validation) Email value does not contain email!');
    if (!Validator.isValidCurrency(registrationInfo.currency))
      throw new Error('(validation) Name should be a currency value!');
    if (!Validator.isValidLanguage(registrationInfo.language))
      throw new Error('(validation) Language should be locale value!');

    return registrationInfo;
  },
  sanitizeUserRegistrationInfo: function sanitizeUserRegistrationInfo(registrationInfo: IUserRegistrationInfo): void {
    registrationInfo.name = Sanitize.name(registrationInfo.name);
    registrationInfo.email = Sanitize.email(registrationInfo.email);
    registrationInfo.currency = Sanitize.currency(registrationInfo.currency);
    registrationInfo.language = Sanitize.language(registrationInfo.language);
  },
  runtimeCast: function runtimeCast(registrationInfo: any): IUserRegistrationInfo {
    if (typeof registrationInfo !== 'object' || registrationInfo === null)
      throw new Error('Type of NewUserInput must be an object!');
    if (!_.isString(registrationInfo.name)) throw new Error('Type of NewUserInput.name must be a string!');
    if (!_.isString(registrationInfo.email)) throw new Error('Type of NewUserInput.email must be a string!');
    if (!_.isString(registrationInfo.currency)) throw new Error('Type of NewUserInput.currency must be a string!');
    if (!_.isString(registrationInfo.language)) throw new Error('Type of NewUserInput.language must be a string!');

    return {
      name: registrationInfo.name,
      email: registrationInfo.email,
      currency: registrationInfo.currency,
      language: registrationInfo.language,
      password: registrationInfo.password,
    };
  },
};

export const userUpdateInfoHelpers = {
  validateUserUpdateInfo: function validateUserUpdateInfo(updateInfo: IUserUpdateInfo): IUserUpdateInfo {
    if (updateInfo.name !== undefined)
      if (!Validator.isValidName(updateInfo.name)) throw new Error('(validation) Name should contain value!');
    if (updateInfo.currency !== undefined)
      if (!Validator.isValidCurrency(updateInfo.currency))
        throw new Error('(validation) Name should be a currency value!');
    if (updateInfo.language !== undefined)
      if (!Validator.isValidLanguage(updateInfo.language))
        throw new Error('(validation) Language should be locale value!');
    return updateInfo;
  },
  sanitizeUserUpdateInfo: function sanitizeUserUpdateInfo(updateInfo: IUserUpdateInfo): void {
    if (updateInfo.name !== undefined) updateInfo.name = Sanitize.name(updateInfo.name);
    if (updateInfo.currency !== undefined) updateInfo.currency = Sanitize.currency(updateInfo.currency);
    if (updateInfo.language !== undefined) updateInfo.language = Sanitize.language(updateInfo.language);
  },
  runtimeCast: function runtimeCast(updateInfo: any): IUserUpdateInfo {
    if (typeof updateInfo !== 'object' || updateInfo === null)
      throw new Error('Type of NewUserInput must be an object!');
    if (updateInfo.name !== undefined)
      if (!_.isString(updateInfo.name)) throw new Error('Type of NewUserInput.name must be a string!');
    if (updateInfo.currency !== undefined)
      if (!_.isString(updateInfo.currency)) throw new Error('Type of NewUserInput.currency must be a string!');
    if (updateInfo.language !== undefined)
      if (!_.isString(updateInfo.language)) throw new Error('Type of NewUserInput.language must be a string!');

    const returnObject = {};
    if (updateInfo.name !== undefined) returnObject['name'] = updateInfo.name;
    if (updateInfo.currency !== undefined) returnObject['currency'] = updateInfo.currency;
    if (updateInfo.language !== undefined) returnObject['language'] = updateInfo.language;
    return returnObject;
  },
};
