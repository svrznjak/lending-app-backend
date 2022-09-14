import { isValidAmountOfMoney, isValidTimestamp } from '../../utils/inputValidator/inputValidator.js';

export const validateTransaction = {
  isValidTransactionTimestamp: function isValidTransactionTimestamp(transactionTimestamp: number): boolean {
    return isValidTimestamp({ timestamp: transactionTimestamp });
  },
  isValidAmount: function isValidAmount(amount: number): boolean {
    return isValidAmountOfMoney({ amount: amount });
  },
  isValidEntryTimestamp: function isValidEntryTimestamp(entryTimestamp: number): boolean {
    return isValidTimestamp({ timestamp: entryTimestamp });
  },
};
