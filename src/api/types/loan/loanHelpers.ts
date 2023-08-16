import { isValidTimestamp, isValidAmountOfMoney, isValidOption } from './../../utils/inputValidator/inputValidator.js';
import { ILoan } from './loanInterface.js';

import { sanitizeText } from './../../utils/inputSanitizer/inputSanitizer.js';
import { interestRateHelpers } from '../interestRate/interestRateHelpers.js';
import { paymentFrequencyHelpers } from '../paymentFrequency/paymentFrequencyHelpers.js';
import { isValidText } from '../../utils/inputValidator/inputValidator.js';
import _ from 'lodash';
export const loanHelpers = {
  validate: {
    all: function validateAll(
      loan: Pick<
        ILoan,
        'name' | 'description' | 'openedTimestamp' | 'closesTimestamp' | 'interestRate' | 'paymentFrequency'
      >,
    ): Pick<
      ILoan,
      'name' | 'description' | 'openedTimestamp' | 'closesTimestamp' | 'interestRate' | 'paymentFrequency'
    > {
      this.name(loan.name);
      this.description(loan.description);
      this.openedTimestamp(loan.openedTimestamp);
      this.closesTimestamp(loan.closesTimestamp);

      interestRateHelpers.validate.all(loan.interestRate);
      paymentFrequencyHelpers.validate.all(loan.paymentFrequency);

      return loan;
    },
    name: function validateName(name: string): string {
      if (
        !isValidText({
          text: name,
          validEmpty: false,
          maxLength: 100,
        })
      )
        throw new Error('(validation) name is invalid!');
      return name;
    },
    description: function validateDescription(description: string): string {
      if (
        !isValidText({
          text: description,
          validEmpty: true,
          maxLength: 1000,
        })
      )
        throw new Error('(validation) description is invalid!');

      return description;
    },
    openedTimestamp: function validateOpenedTimestamp(openedTimestamp: number): number {
      if (
        !isValidTimestamp({
          timestamp: openedTimestamp,
        })
      )
        throw new Error('(validation) openedTimestamp is invalid!');
      return openedTimestamp;
    },
    closesTimestamp: function validateClosesTimestamp(closesTimestamp: number): number {
      if (
        !isValidTimestamp({
          timestamp: closesTimestamp,
        })
      )
        throw new Error('(validation) closesTimestamp is invalid!');
      return closesTimestamp;
    },
    amount: function validateAmount(amount: number): number {
      if (!isValidAmountOfMoney({ amount: amount })) throw new Error('(validation) amount is invalid!');
      return amount;
    },
    status: function validateStatus(status: ILoan['status']): ILoan['status'] {
      if (
        !isValidOption({
          option: status.current.toString(),
          validOptions: ['ACTIVE', 'PAUSED', 'PAID', 'COMPLETED', 'DEFAULTED'],
          caseSensitive: true,
        })
      )
        throw new Error('(validation) loan current status is invalid!');
      if (
        !isValidTimestamp({
          timestamp: status.timestamp,
        })
      )
        throw new Error('(validation) loan status timestamp is invalid!');

      return status;
    },
  },

  sanitize: {
    all: function sanitizeAll(loan: Partial<ILoan>): void {
      loan.name = this.name(loan.name);
      loan.description = this.description(loan.description);
    },
    name: function sanitizeName(name: string): string {
      return sanitizeText({ text: name });
    },
    description: function sanitizeDescription(description: string): string {
      return sanitizeText({ text: description });
    },
  },
  runtimeCast: function runtimeCast(loan: any): ILoan {
    if (typeof this !== 'object' || this === null) throw new Error('Type of loan must be an object!');
    if (!_.isString(loan._id)) throw new Error('Type of loan._id must be a string!');
    if (!_.isString(loan.userId)) throw new Error('Type of loan.userId must be a string!');
    if (!_.isString(loan.name)) throw new Error('Type of loan.name must be a string!');
    if (!_.isString(loan.description)) throw new Error('Type of loan.description must be a string!');
    if (!Array.isArray(loan.notes)) throw new Error('Type of loan.notes must be an Array!');
    if (!Number.isFinite(loan.openedTimestamp)) throw new Error('Type of loan.openedTimestamp must be a number!');
    if (!Number.isFinite(loan.closesTimestamp)) throw new Error('Type of loan.closesTimestamp must be a number!');

    // typecheck status
    if (typeof loan.status !== 'object' || loan.status === null)
      if (!_.isString(loan.status.current)) throw new Error('Type of loan.status must be a string!');

    if (!Number.isFinite(loan.calculatedInvestedAmount))
      throw new Error('Type of loan.calculatedTotalPaidPrincipal must be a number!');
    if (!Number.isFinite(loan.calculatedTotalPaidPrincipal))
      throw new Error('Type of loan.calculatedTotalPaidPrincipal must be a number!');
    if (!Number.isFinite(loan.calculatedOutstandingInterest))
      throw new Error('Type of loan.calculatedOutstandingInterest must be a number!');
    if (!Number.isFinite(loan.calculatedPaidInterest))
      throw new Error('Type of loan.calculatedPaidInterest must be a number!');
    if (!Number.isFinite(loan.calculatedLastTransactionTimestamp))
      throw new Error('Type of loan.calculatedLastTransactionTimestamp must be a number!');

    // typecheck paymentFrequency
    if (typeof loan.paymentFrequency !== 'object' || loan.paymentFrequency === null)
      throw new Error('Type of loan.paymentFrequency must be an object!');
    if (!_.isString(loan.paymentFrequency.occurrence))
      throw new Error('Type of loan.paymentFrequency.occurrence must be a string!');
    if (!_.isBoolean(loan.paymentFrequency.isStrict))
      throw new Error('Type of loan.paymentFrequency.isStrict must be a boolean!');
    if (loan.paymentFrequency.isStrict === true) {
      if (!_.isString(loan.paymentFrequency.strictValue))
        throw new Error('Type of loan.paymentFrequency.strictValue must be a string!');
    }

    interestRateHelpers.runtimeCast(loan.interestRate);
    paymentFrequencyHelpers.runtimeCast(loan.paymentFrequency);

    // typecheck relatedBudgets
    loan.calculatedRelatedBudgets.forEach((relatedBudget) => {
      if (typeof relatedBudget !== 'object' || relatedBudget === null)
        throw new Error('Type of loan.relatedBudget must be an object!');
      if (!_.isString(relatedBudget.budgetId)) throw new Error('Type of loan.relatedBudget.budgetId must be a string!');
      if (!Number.isFinite(relatedBudget.invested))
        throw new Error('Type of loan.relatedBudget.invested must be a number!');
      if (!Number.isFinite(relatedBudget.withdrawn))
        throw new Error('Type of loan.relatedBudget.withdrawn must be a number!');
    });

    return {
      _id: loan._id,
      userId: loan.userId,
      name: loan.name,
      description: loan.description,
      customerId: loan.customerId,
      notes: loan.notes,
      openedTimestamp: loan.openedTimestamp,
      closesTimestamp: loan.closesTimestamp,
      interestRate: loan.interestRate,
      paymentFrequency: loan.paymentFrequency,
      expectedPayments: loan.expectedPayments,
      status: loan.status,
      calculatedInvestedAmount: loan.calculatedInvestedAmount,
      calculatedTotalPaidPrincipal: loan.calculatedTotalPaidPrincipal,
      calculatedOutstandingInterest: loan.calculatedOutstandingInterest,
      calculatedPaidInterest: loan.calculatedPaidInterest,
      calculatedLastTransactionTimestamp: loan.calculatedLastTransactionTimestamp,
      calculatedRelatedBudgets: loan.calculatedRelatedBudgets,
      transactionList: loan.transactionList,
    };
  },
};
