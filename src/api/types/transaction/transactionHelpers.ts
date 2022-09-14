import _ from 'lodash';
import { ITransaction } from './transactionInterface.js';
import { validateTransaction } from './transactionValidator.js';
import { sanitizeTransaction } from './transactionSanitizer.js';
import { transactionAddressHelpers } from '../transactionAddress/transactionAddressHelpers.js';

export const transactionHelpers = {
  validate: function validate(
    transaction: Pick<
      ITransaction,
      'transactionTimestamp' | 'description' | 'from' | 'to' | 'amount' | 'entryTimestamp'
    >,
  ): Pick<ITransaction, 'transactionTimestamp' | 'description' | 'amount' | 'entryTimestamp'> {
    if (!validateTransaction.isValidTransactionTimestamp(transaction.transactionTimestamp))
      throw new Error('(validation) transaction.transactionTimestamp is invalid!');
    if (!validateTransaction.isValidAmount(transaction.amount))
      throw new Error('(validation) transaction.isValidAmount is invalid!');
    if (!validateTransaction.isValidEntryTimestamp(transaction.entryTimestamp))
      throw new Error('(validation) transaction.isValidEntryTimestamp is invalid!');

    transactionAddressHelpers.validate(transaction.from);
    transactionAddressHelpers.validate(transaction.to);

    return transaction;
  },

  sanitize: function sanitize(transaction: ITransaction): void {
    transaction.description = sanitizeTransaction.description(transaction.description);
  },

  runtimeCast: function runtimeCast(transaction: any): ITransaction {
    if (typeof this !== 'object' || this === null) throw new Error('Type of transaction must be an object!');
    if (!_.isString(transaction._id)) throw new Error('Type of transaction._id must be a string!');
    if (!Number.isFinite(transaction.createdAtTimestamp))
      throw new Error('Type of transaction.createdAtTimestamp must be a number!');
    if (!_.isString(transaction.description)) throw new Error('Type of transaction.description must be a string!');
    if (!Number.isFinite(transaction.amount)) throw new Error('Type of transaction.amount must be a number!');
    if (!Number.isFinite(transaction.entryTimestamp))
      throw new Error('Type of transaction.entryTimestamp must be a number!');
    if (!Array.isArray(transaction.revisions)) throw new Error('Type of transaction.revisions must be an array!');

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
