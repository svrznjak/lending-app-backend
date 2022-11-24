/* eslint-disable @typescript-eslint/ban-types */
import validator from 'validator';
import _ from 'lodash';

import currencies from '../../types/currencies.js';

import locales from '../../types/locales.js';

export const isValidText = function isValidText(
  {
    text,
    validEmpty = false,
    minLength = 0,
    maxLength = Infinity,
  }: {
    text: string;
    validEmpty?: boolean;
    minLength?: number;
    maxLength?: number;
  },
  extend: undefined | Function = undefined,
): boolean {
  if (!validEmpty) {
    if (validator.isEmpty(text, { ignore_whitespace: true })) return false;
  }
  if (text.length <= minLength && !validEmpty) return false;
  if (text.length >= maxLength) return false;

  if (extend === undefined) return true;
  if (
    extend({
      text,
      validEmpty,
      minLength,
      maxLength,
    }) === false
  )
    return false;
  return true;
};

export const isValidEmail = function isValidEmail(
  { email }: { email: string },
  extend: undefined | Function = undefined,
): boolean {
  if (!validator.isEmail(email)) return false;

  if (extend === undefined) return true;
  if (
    extend({
      email,
    }) === false
  )
    return false;
  return true;
};

export const isValidAmountOfMoney = function isValidAmountOfMoney(
  { amount }: { amount: number },
  extend: undefined | Function = undefined,
): boolean {
  if (!Number.isFinite(amount)) return false;
  if (amount > 900719925474) return false;
  if (amount < 0) return false;

  if (extend === undefined) return true;
  if (
    extend({
      amount,
    }) === false
  )
    return false;
  return true;
};

export const isValidTimestamp = function isValidTimestamp(
  { timestamp }: { timestamp: number },
  extend: undefined | Function = undefined,
): boolean {
  if (!Number.isFinite(timestamp)) return false;
  if (timestamp < -1) return false;
  if (timestamp > 95649119999000) return false;
  if (new Date(timestamp).toString() === 'Invalid Date') return false;

  if (extend === undefined) return true;
  if (
    extend({
      timestamp,
    }) === false
  )
    return false;
  return true;
};

export const isValidOption = function isValidOption(
  {
    option,
    validOptions = [],
    caseSensitive = true,
  }: {
    option: string;
    validOptions: string[];
    caseSensitive?: boolean;
  },
  extend: undefined | Function = undefined,
): boolean {
  if (!caseSensitive) {
    option = option.toLowerCase();
    for (let i = 0; i < validOptions.length; i++) {
      validOptions[i] = validOptions[i].toLowerCase();
    }
  }

  if (extend === undefined) return validOptions.includes(option);
  if (
    extend({
      option,
      validOptions,
      caseSensitive,
    }) === false
  )
    return false;
  return validOptions.includes(option);
};

export const isValidLanguage = function validateUserLanguage(
  {
    language,
    caseSensitive = true,
  }: {
    language: string;
    caseSensitive?: boolean;
  },
  extend: undefined | Function = undefined,
): boolean {
  const languages: string[] = _.clone(locales);
  if (!caseSensitive) {
    language = language.toLowerCase();
    for (let i = 0; i < languages.length; i++) {
      languages[i] = languages[i].toLowerCase();
    }
  }

  if (extend === undefined) return languages.includes(language);
  if (
    extend({
      language,
      caseSensitive,
    }) === false
  )
    return false;
  return languages.includes(language);
};

export const isValidCurrency = function validateUserCurrency(
  {
    currency,
    caseSensitive = true,
  }: {
    currency: string;
    caseSensitive?: boolean;
  },
  extend: undefined | Function = undefined,
): boolean {
  if (currency.length !== 3) return false;
  if (!caseSensitive) {
    currency = currency.toUpperCase();
  }

  if (extend === undefined) return currencies.includes(currency);
  if (
    extend({
      currency,
      caseSensitive,
    }) === false
  )
    return false;
  return currencies.includes(currency);
};
