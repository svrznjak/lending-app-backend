import validator from 'validator';
import _ from 'lodash';

import { NewUserInput, UpdateUserInput } from '../interfaces/User.js';

export function validateNewUserInput(newUserInput: NewUserInput): NewUserInput {
  const validatedNewUserInput: NewUserInput = _.cloneDeep(newUserInput);

  validatedNewUserInput.name = validateUserName(validatedNewUserInput.name);
  validatedNewUserInput.email = validateUserEmail(validatedNewUserInput.email);
  validatedNewUserInput.currency = validateUserCurrency(validatedNewUserInput.currency);
  validatedNewUserInput.language = validateUserLanguage(validatedNewUserInput.language);

  return validatedNewUserInput;
}

export function validateUpdateUserInput(updateUserInput: UpdateUserInput): UpdateUserInput {
  const validatedUpdateUserInput: UpdateUserInput = _.cloneDeep(updateUserInput);

  if (validatedUpdateUserInput.name !== undefined)
    validatedUpdateUserInput.name = validateUserName(validatedUpdateUserInput.name);
  if (validatedUpdateUserInput.currency !== undefined)
    validatedUpdateUserInput.currency = validateUserCurrency(validatedUpdateUserInput.currency);
  if (validatedUpdateUserInput.language !== undefined)
    validatedUpdateUserInput.language = validateUserLanguage(validatedUpdateUserInput.language);

  return validatedUpdateUserInput;
}

export function validateUserName(name: string): string {
  if (!validator.isEmpty(name, { ignore_whitespace: true })) throw new Error('(validation) Name should contain value!');
  return name;
}

export function validateUserEmail(email: string): string {
  if (!validator.isEmail(email)) throw new Error('(validation) Email value does not contain email!');
  return email;
}

export function validateUserCurrency(currency: string): string {
  if (!validator.isEmpty(currency, { ignore_whitespace: true }))
    throw new Error('(validation) Currency should contain value!');

  // TODO : check if value is currency (USD, EUR, etc.)
  return currency;
}

export function validateUserLanguage(language: string): string {
  if (!validator.isLocale(language)) throw new Error('(validation) Language should be locale value!');
  return language;
}
