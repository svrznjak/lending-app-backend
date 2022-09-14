import { isValidAmountOfMoney, isValidOption, isValidTimestamp } from '../../utils/inputValidator/inputValidator.js';

export const validateInterestRate = {
  isValidType: function isValidType(type: string): boolean {
    return isValidOption({
      option: type,
      validOptions: ['PERCENTAGE_PER_DURATION', 'FIXED_PER_DURATION'],
      caseSensitive: true,
    });
  },
  isValidDuration: function isValidDuration(duration: string): boolean {
    return isValidOption({
      option: duration,
      validOptions: ['DAY', 'WEEK', 'MONTH', 'YEAR', 'FULL_DURATION'],
      caseSensitive: true,
    });
  },
  isValidAmount: function isValidAmount(amount: number): boolean {
    return isValidAmountOfMoney({ amount: amount });
  },
  isValidEntryTimestamp: function isValidEntryTimestamp(timestamp: number): boolean {
    return isValidTimestamp({ timestamp: timestamp });
  },
};
