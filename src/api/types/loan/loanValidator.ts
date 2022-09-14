import { isValidText, isValidTimestamp } from '../../utils/inputValidator/inputValidator.js';

export const validateLoan = {
  isValidName: function isValidName(name: string): boolean {
    return isValidText({
      text: name,
      maxLength: 100,
    });
  },
  isValidDescription: function isValidDescription(description: string): boolean {
    return isValidText({
      text: description,
      validEmpty: true,
      maxLength: 1000,
    });
  },
  isValidOpenedTimestamp: function isValidOpenedTimestamp(openedTimestamp: number): boolean {
    return isValidTimestamp({ timestamp: openedTimestamp });
  },
  isValidClosesTimestamp: function isValidClosesTimestamp(closesTimestamp: number): boolean {
    return isValidTimestamp({ timestamp: closesTimestamp });
  },
};
