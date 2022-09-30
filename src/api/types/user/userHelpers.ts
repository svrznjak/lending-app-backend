import { sanitizeEmail, sanitizeText } from './../../utils/inputSanitizer/inputSanitizer.js';
import { IUser, IUserRegistrationInfo, IUserUpdateInfo } from './userInterface.js';
import _ from 'lodash';
import { subscriptionHelpers } from '../subscription/subscriptionHelpers.js';
import {
  isValidCurrency,
  isValidEmail,
  isValidLanguage,
  isValidText,
} from '../../utils/inputValidator/inputValidator.js';

export const userHelpers = {
  validate: function validateUser(user: IUser): IUser {
    // Validate is currently not implemented on userHelpers, because this helper is currently only used as output from database.
    throw new Error('Function not implemented!');
    return user;
  },
  sanitize: function sanitizeUser(user: IUser): IUser {
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
    if (!_.isString(user.currency)) throw new Error('Type of User.currency must be a string!');
    if (!_.isString(user.language)) throw new Error('Type of User.language must be a string!');

    subscriptionHelpers.runtimeCast(user.subscription);

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      authId: user.authId,
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
    if (
      !isValidText({
        text: registrationInfo.name,
        validEmpty: false,
        maxLength: 100,
      })
    )
      throw new Error('(validation) Name should contain value!');
    if (!isValidEmail({ email: registrationInfo.email }))
      throw new Error('(validation) Email value does not contain email!');
    if (
      !isValidCurrency({
        currency: registrationInfo.currency,
        caseSensitive: true,
      })
    )
      throw new Error('(validation) Name should be a currency value!');
    if (
      !isValidLanguage({
        language: registrationInfo.language,
        caseSensitive: true,
      })
    )
      throw new Error('(validation) Language should be locale value!');

    return registrationInfo;
  },
  sanitizeUserRegistrationInfo: function sanitizeUserRegistrationInfo(registrationInfo: IUserRegistrationInfo): void {
    registrationInfo.name = sanitizeText({ text: registrationInfo.name });
    registrationInfo.email = sanitizeEmail({ email: registrationInfo.email });
    registrationInfo.currency = sanitizeText({ text: registrationInfo.currency });
    registrationInfo.language = sanitizeText({ text: registrationInfo.language });
  },
  runtimeCast: function runtimeCast(registrationInfo: any): IUserRegistrationInfo {
    if (typeof registrationInfo !== 'object' || registrationInfo === null)
      throw new Error('Type of registrationInfo must be an object!');
    if (!_.isString(registrationInfo.name)) throw new Error('Type of registrationInfo.name must be a string!');
    if (!_.isString(registrationInfo.email)) throw new Error('Type of registrationInfo.email must be a string!');
    if (!_.isString(registrationInfo.currency)) throw new Error('Type of registrationInfo.currency must be a string!');
    if (!_.isString(registrationInfo.language)) throw new Error('Type of registrationInfo.language must be a string!');
    if (!_.isString(registrationInfo.password)) throw new Error('Type of registrationInfo.password must be a string!');

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
      if (
        !isValidText({
          text: updateInfo.name,
          validEmpty: false,
          maxLength: 100,
        })
      )
        throw new Error('(validation) Name should contain value!');
    if (updateInfo.currency !== undefined)
      if (
        !isValidCurrency({
          currency: updateInfo.currency,
          caseSensitive: true,
        })
      )
        throw new Error('(validation) Name should be a currency value!');
    if (updateInfo.language !== undefined)
      if (
        !isValidLanguage({
          language: updateInfo.language,
          caseSensitive: true,
        })
      )
        throw new Error('(validation) Language should be locale value!');
    return updateInfo;
  },
  sanitizeUserUpdateInfo: function sanitizeUserUpdateInfo(updateInfo: IUserUpdateInfo): void {
    if (updateInfo.name !== undefined) updateInfo.name = sanitizeText({ text: updateInfo.name });
    if (updateInfo.currency !== undefined) updateInfo.currency = sanitizeText({ text: updateInfo.currency });
    if (updateInfo.language !== undefined) updateInfo.language = sanitizeText({ text: updateInfo.language });
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
