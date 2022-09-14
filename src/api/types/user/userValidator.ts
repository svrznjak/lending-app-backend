import {
  isValidCurrency,
  isValidEmail,
  isValidLanguage,
  isValidText,
} from '../../utils/inputValidator/inputValidator.js';

export default {
  isValidName: function validateUserName(name: string): boolean {
    return isValidText({
      text: name,
      validEmpty: false,
      maxLength: 100,
    });
  },
  isValidEmail: function validateUserEmail(email: string): boolean {
    return isValidEmail({ email: email });
  },
  isValidCurrency: function validateUserCurrency(currency: string): boolean {
    return isValidCurrency({
      currency: currency,
      caseSensitive: true,
    });
  },
  isValidLanguage: function validateUserLanguage(language: string): boolean {
    return isValidLanguage({
      language: language,
      caseSensitive: true,
    });
  },
};
