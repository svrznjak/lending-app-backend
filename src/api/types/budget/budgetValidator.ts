import { isValidText } from '../../utils/inputValidator/inputValidator.js';

export const validateBudget = {
  isValidName: function isValidBudgetName(name: string): boolean {
    return isValidText({
      text: name,
      validEmpty: false,
      maxLength: 100,
    });
  },
  isValidDescription: function isValidBudgetDescription(description: string): boolean {
    return isValidText({
      text: description,
      validEmpty: true,
      maxLength: 1000,
    });
  },
};
