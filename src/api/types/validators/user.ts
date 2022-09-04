import validator from 'validator';
import _ from 'lodash';

import { NewUserInput } from '../interfaces/User.js';

export function validateNewUserInput(newUserInput: NewUserInput): NewUserInput {
  const validatedNewUserInput: NewUserInput = _.cloneDeep(newUserInput);

  return validatedNewUserInput;
}

export function validateUserName(name: string): string {
  if (!validator.isEmpty(name, { ignore_whitespace: true }))
    throw new Error('(validation) Name should contain value!');
  return name;
}

export function validateUserEmail(email: string): string {
  if (!validator.isEmail(email))
    throw new Error('(validation) Email value does not contain email!');
  return email;
}

export function validateUserCurrency(currency: string): string {
  if (!validator.isEmpty(currency, { ignore_whitespace: true }))
    throw new Error('(validation) Currency should contain value!');

  // TODO : check if value is currency (USD, EUR, etc.)
  return currency;
}

export function validateUserLanguage(language: string): string {
  if (!validator.isLocale(language))
    throw new Error('(validation) Language should be locale value!');
  return language;
}
