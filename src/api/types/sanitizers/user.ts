import validator from 'validator';
import _ from 'lodash';
import { NewUserInput, UpdateUserInput } from '../interfaces/User.js';

export function sanitizeNewUserInput(newUserInput: NewUserInput): NewUserInput {
  const sanatizedNewUserInput: NewUserInput = _.cloneDeep(newUserInput);

  sanatizedNewUserInput.name = sanitizeUserName(sanatizedNewUserInput.name);
  sanatizedNewUserInput.email = sanitizeUserEmail(sanatizedNewUserInput.email);
  sanatizedNewUserInput.currency = sanitizeUserCurrency(
    sanatizedNewUserInput.currency,
  );
  sanatizedNewUserInput.language = sanitizeUserLanguage(
    sanatizedNewUserInput.language,
  );

  return sanatizedNewUserInput;
}

export function sanitizeUpdateUserInput(
  updateUserInput: UpdateUserInput,
): UpdateUserInput {
  const sanatizedUpdateUserInput: UpdateUserInput =
    _.cloneDeep(updateUserInput);

  sanatizedUpdateUserInput.name = sanitizeUserName(
    sanatizedUpdateUserInput.name,
  );
  sanatizedUpdateUserInput.currency = sanitizeUserCurrency(
    sanatizedUpdateUserInput.currency,
  );
  sanatizedUpdateUserInput.language = sanitizeUserLanguage(
    sanatizedUpdateUserInput.language,
  );

  return sanatizedUpdateUserInput;
}

export function sanitizeUserName(name: string): string {
  name = validator.trim(name);
  name = validator.escape(name);
  return name;
}

export function sanitizeUserEmail(email: string): string {
  email = validator.trim(email);
  email = validator.normalizeEmail(email);
  return email;
}

export function sanitizeUserCurrency(currency: string): string {
  currency = validator.trim(currency);
  currency = _.lowerCase(currency);
  return currency;
}

export function sanitizeUserLanguage(language: string): string {
  language = validator.trim(language);
  language = _.lowerCase(language);
  return language;
}
