import { isValidOption } from '../../utils/inputValidator/inputValidator.js';

export const validateTransactionAddress = {
  isValidTransactionAddress: function isValidTransactionAddress(datatype: string): boolean {
    return isValidOption({
      option: datatype,
      validOptions: ['BUDGET', 'LOAN', 'INTEREST', 'OUTSIDE'],
      caseSensitive: true,
    });
  },
};
