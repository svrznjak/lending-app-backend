import { sanitizeText } from './../../utils/inputSanitizer/inputSanitizer.js';
import _ from 'lodash';
import { ITransaction } from './transactionInterface.js';
import { transactionAddressHelpers } from '../transactionAddress/transactionAddressHelpers.js';
import { isValidAmountOfMoney, isValidTimestamp, isValidText } from '../../utils/inputValidator/inputValidator.js';
import { interestRateHelpers } from '../interestRate/interestRateHelpers.js';

export const transactionHelpers = {
  validate: {
    all: function validateAll(
      transaction: Pick<
        ITransaction,
        | 'transactionTimestamp'
        | 'description'
        | 'interestRate'
        | 'amount'
        | 'relatedBudgetId'
        | 'entryTimestamp'
        | 'from'
        | 'to'
      >,
    ): Pick<
      ITransaction,
      | 'transactionTimestamp'
      | 'description'
      | 'interestRate'
      | 'amount'
      | 'relatedBudgetId'
      | 'entryTimestamp'
      | 'from'
      | 'to'
    > {
      this.transactionTimestamp(transaction.transactionTimestamp);
      this.description(transaction.description);
      this.amount(transaction.amount);
      this.entryTimestamp(transaction.entryTimestamp);

      transactionAddressHelpers.validate.all(transaction.from);
      transactionAddressHelpers.validate.all(transaction.to);

      if (transaction.from.datatype === 'BUDGET' && transaction.to.datatype === 'LOAN') {
        interestRateHelpers.validate.all(transaction.interestRate);
      }
      if (transaction.from.datatype === 'FEE' && transaction.to.datatype === 'LOAN')
        if (transaction.relatedBudgetId === undefined) throw new Error('(validation) relatedBudgetId is undefined!');

      return transaction;
    },
    transactionTimestamp: function validateTransactionTimestamp(transactionTimestamp: number): number {
      if (!isValidTimestamp({ timestamp: transactionTimestamp }))
        throw new Error('(validation) transactionTimestamp is invalid!');
      return transactionTimestamp;
    },
    description: function validateDescription(description: string): string {
      if (!isValidText({ text: description, validEmpty: true, maxLength: 1000 }))
        throw new Error('(validation) description is invalid!');
      return description;
    },
    amount: function validateAmount(amount: number): number {
      if (!isValidAmountOfMoney({ amount: amount })) throw new Error('(validation) isValidAmount is invalid!');
      return amount;
    },
    entryTimestamp: function validateEntryTimestramp(entryTimestamp: number): number {
      if (!isValidTimestamp({ timestamp: entryTimestamp }))
        throw new Error('(validation) isValidEntryTimestamp is invalid!');
      return entryTimestamp;
    },
  },

  sanitize: {
    all: function sanitizeAll(transaction: Partial<ITransaction>): void {
      transaction.description = this.description(transaction.description);
    },
    description: function sanitizeDescription(description: string): string {
      return sanitizeText({ text: description });
    },
  },

  runtimeCast: function runtimeCast(transaction: any): ITransaction {
    if (typeof this !== 'object' || this === null) throw new Error('Type of transaction must be an object!');
    if (!_.isString(transaction._id)) throw new Error('Type of transaction._id must be a string!');
    if (!_.isString(transaction.userId)) throw new Error('Type of transaction.userId must be a string!');
    if (!Number.isFinite(transaction.transactionTimestamp))
      throw new Error('Type of transaction.transactionTimestamp must be a number!');
    if (!_.isString(transaction.description)) throw new Error('Type of transaction.description must be a string!');
    if (transaction.refund !== undefined && !_.isBoolean(transaction.refund))
      throw new Error('Type of transaction.refund must be a boolean!');

    if (transaction.from.datatype === 'BUDGET' && transaction.to.datatype === 'LOAN') {
      // transaction.interestRate must be defined
      interestRateHelpers.runtimeCast(transaction.interestRate);
    }

    if (!Number.isFinite(transaction.amount)) throw new Error('Type of transaction.amount must be a number!');
    if (!Number.isFinite(transaction.entryTimestamp))
      throw new Error('Type of transaction.entryTimestamp must be a number!');
    if (!_.isPlainObject(transaction.revisions) && transaction.revisions !== undefined)
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
      refund: transaction.refund,
      interestRate: transaction.interestRate,
      relatedBudgetId: transaction.relatedBudgetId,
      amount: transaction.amount,
      entryTimestamp: transaction.entryTimestamp,
      revisions: transaction.revisions,
    };
  },
};
