import { sanitizeText } from './../../utils/inputSanitizer/inputSanitizer.js';
import _ from 'lodash';
import { ITransaction } from './transactionInterface.js';
import { transactionAddressHelpers } from '../transactionAddress/transactionAddressHelpers.js';
import { isValidAmountOfMoney, isValidTimestamp, isValidText } from '../../utils/inputValidator/inputValidator.js';

export const transactionHelpers = {
  validate: function validate(transaction: Partial<ITransaction>): Partial<ITransaction> {
    if (
      transaction.transactionTimestamp !== undefined &&
      !isValidTimestamp({ timestamp: transaction.transactionTimestamp })
    )
      throw new Error('(validation) transaction.transactionTimestamp is invalid!');
    if (
      transaction.description !== undefined &&
      !isValidText({ text: transaction.description, validEmpty: true, maxLength: 1000 })
    )
      throw new Error('(validation) transaction.description is invalid!');
    if (transaction.amount !== undefined && !isValidAmountOfMoney({ amount: transaction.amount }))
      throw new Error('(validation) transaction.isValidAmount is invalid!');
    if (transaction.entryTimestamp !== undefined && !isValidTimestamp({ timestamp: transaction.entryTimestamp }))
      throw new Error('(validation) transaction.isValidEntryTimestamp is invalid!');

    if (transaction.from !== undefined) transactionAddressHelpers.validate(transaction.from);
    if (transaction.to !== undefined) transactionAddressHelpers.validate(transaction.to);

    return transaction;
  },

  sanitize: function sanitize(transaction: Partial<ITransaction>): void {
    transaction.description = sanitizeText({ text: transaction.description });
  },

  runtimeCast: function runtimeCast(transaction: any): ITransaction {
    if (typeof this !== 'object' || this === null) throw new Error('Type of transaction must be an object!');
    if (!_.isString(transaction._id)) throw new Error('Type of transaction._id must be a string!');
    if (!_.isString(transaction.userId)) throw new Error('Type of transaction.userId must be a string!');
    if (!Number.isFinite(transaction.transactionTimestamp))
      throw new Error('Type of transaction.transactionTimestamp must be a number!');
    if (!_.isString(transaction.description)) throw new Error('Type of transaction.description must be a string!');
    if (!Number.isFinite(transaction.amount)) throw new Error('Type of transaction.amount must be a number!');
    if (!Number.isFinite(transaction.entryTimestamp))
      throw new Error('Type of transaction.entryTimestamp must be a number!');
    if (!_.isObject(transaction.revisions) && transaction.revisions !== undefined)
      throw new Error('Type of transaction.revisions must be an object or undefined!');

    transactionAddressHelpers.runtimeCast(transaction.from);
    transactionAddressHelpers.runtimeCast(transaction.to);

    return {
      _id: transaction._id,
      userId: transaction.userId,
      transactionTimestamp: transaction.transactionTimestamp,
      description: transaction.description,
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount,
      entryTimestamp: transaction.entryTimestamp,
      revisions: transaction.revisions,
    };
  },
};
