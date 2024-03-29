import { sanitizeEmail, sanitizeText } from './../../utils/inputSanitizer/inputSanitizer.js';
import { IUser, IUserInitializeInfo, IUserUpdateInfo } from './userInterface.js';
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
    if (!_.isString(user.formattingLocale)) throw new Error('Type of User.formattingLocale must be a string!');

    subscriptionHelpers.runtimeCast(user.subscription);

    // check if all notificationTokens are strings
    if (!Array.isArray(user.notificationTokens)) throw new Error('Type of User.notificationTokens must be an array!');
    for (const notificationToken of user.notificationTokens) {
      if (!_.isString(notificationToken))
        throw new Error('Type of User.notificationTokens must be an array of strings!');
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      authId: user.authId,
      currency: user.currency,
      language: user.language,
      formattingLocale: user.formattingLocale,
      subscription: user.subscription,
      notificationTokens: user.notificationTokens,
    };
  },
};

export const userInitializeInfoHelpers = {
  validate: function validateUserInitializeInfo(initializeInfo: IUserInitializeInfo): IUserInitializeInfo {
    if (
      !isValidText({
        text: initializeInfo.name,
        validEmpty: false,
        maxLength: 100,
      })
    )
      throw new Error('(validation) Name should contain value!');
    if (!isValidEmail({ email: initializeInfo.email }))
      throw new Error('(validation) Email value does not contain email!');
    if (
      !isValidCurrency({
        currency: initializeInfo.currency,
        caseSensitive: true,
      })
    )
      throw new Error('(validation) Name should be a currency value!');
    if (
      !isValidLanguage({
        language: initializeInfo.language,
        caseSensitive: true,
      })
    )
      throw new Error('(validation) Language should be locale value!');
    if (
      !isValidLanguage({
        language: initializeInfo.formattingLocale,
        caseSensitive: true,
      })
    )
      throw new Error('(validation) Formatting locale should be locale value!');

    return initializeInfo;
  },
  sanitize: function sanitizeUserInitializeInfo(initializeInfo: IUserInitializeInfo): void {
    initializeInfo.name = sanitizeText({ text: initializeInfo.name });
    initializeInfo.email = sanitizeEmail({ email: initializeInfo.email });
    initializeInfo.currency = sanitizeText({ text: initializeInfo.currency });
    initializeInfo.language = sanitizeText({ text: initializeInfo.language });
    initializeInfo.formattingLocale = sanitizeText({ text: initializeInfo.formattingLocale });
  },
  runtimeCast: function runtimeCast(initializeInfo: any): IUserInitializeInfo {
    if (typeof initializeInfo !== 'object' || initializeInfo === null)
      throw new Error('Type of initializeInfo must be an object!');
    if (!_.isString(initializeInfo.name)) throw new Error('Type of initializeInfo.name must be a string!');
    if (!_.isString(initializeInfo.email)) throw new Error('Type of initializeInfo.email must be a string!');
    if (!_.isString(initializeInfo.authId)) throw new Error('Type of initializeInfo.authId must be a string!');
    if (!_.isString(initializeInfo.currency)) throw new Error('Type of initializeInfo.currency must be a string!');
    if (!_.isString(initializeInfo.language)) throw new Error('Type of initializeInfo.language must be a string!');
    if (!_.isString(initializeInfo.formattingLocale))
      throw new Error('Type of initializeInfo.formattingLocale must be a string!');

    return {
      name: initializeInfo.name,
      email: initializeInfo.email,
      authId: initializeInfo.authId,
      currency: initializeInfo.currency,
      language: initializeInfo.language,
      formattingLocale: initializeInfo.formattingLocale,
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
    if (updateInfo.formattingLocale !== undefined)
      if (
        !isValidLanguage({
          language: updateInfo.formattingLocale,
          caseSensitive: true,
        })
      )
        throw new Error('(validation) Formatting locale should be locale value!');
    return updateInfo;
  },
  sanitizeUserUpdateInfo: function sanitizeUserUpdateInfo(updateInfo: IUserUpdateInfo): void {
    if (updateInfo.name !== undefined) updateInfo.name = sanitizeText({ text: updateInfo.name });
    if (updateInfo.currency !== undefined) updateInfo.currency = sanitizeText({ text: updateInfo.currency });
    if (updateInfo.language !== undefined) updateInfo.language = sanitizeText({ text: updateInfo.language });
    if (updateInfo.formattingLocale !== undefined)
      updateInfo.formattingLocale = sanitizeText({ text: updateInfo.formattingLocale });
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
    if (updateInfo.formattingLocale !== undefined)
      if (!_.isString(updateInfo.formattingLocale))
        throw new Error('Type of NewUserInput.formattingLocale must be a string!');

    const returnObject = {};
    if (updateInfo.name !== undefined) returnObject['name'] = updateInfo.name;
    if (updateInfo.currency !== undefined) returnObject['currency'] = updateInfo.currency;
    if (updateInfo.language !== undefined) returnObject['language'] = updateInfo.language;
    if (updateInfo.formattingLocale !== undefined) returnObject['formattingLocale'] = updateInfo.formattingLocale;
    return returnObject;
  },
};
