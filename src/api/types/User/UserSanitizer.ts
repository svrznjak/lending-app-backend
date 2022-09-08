import validator from 'validator';
import _ from 'lodash';

export default {
  name: function sanitizeUserName(name: string): string {
    name = validator.trim(name);
    name = validator.escape(name);
    return name;
  },
  email: function sanitizeUserEmail(email: string): string {
    email = validator.trim(email);
    email = validator.normalizeEmail(email, {
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      gmail_convert_googlemaildotcom: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false,
    });
    return email;
  },
  currency: function sanitizeUserCurrency(currency: string): string {
    currency = validator.trim(currency);
    currency = _.lowerCase(currency);
    return currency;
  },
  language: function sanitizeUserLanguage(language: string): string {
    language = validator.trim(language);
    return language;
  },
};
