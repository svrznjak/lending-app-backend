import validator from 'validator';

export default {
  isValidName: function validateUserName(name: string): boolean {
    if (validator.isEmpty(name, { ignore_whitespace: true })) return false;
    return true;
  },
  isValidEmail: function validateUserEmail(email: string): boolean {
    if (!validator.isEmail(email)) return false;
    return true;
  },
  isValidCurrency: function validateUserCurrency(currency: string): boolean {
    if (validator.isEmpty(currency, { ignore_whitespace: true })) return false;
    // TODO : check if value is currency (USD, EUR, etc.)
    return true;
  },
  isValidLanguage: function validateUserLanguage(language: string): boolean {
    if (!validator.isLocale(language)) return false;
    return true;
  },
};
