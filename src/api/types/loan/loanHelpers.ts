import { isValidTimestamp, isValidAmountOfMoney } from './../../utils/inputValidator/inputValidator.js';
import { ILoan } from './loanInterface.js';

import { sanitizeText } from './../../utils/inputSanitizer/inputSanitizer.js';
import { interestRateHelpers } from '../interestRate/interestRateHelpers.js';
import { isValidText } from '../../utils/inputValidator/inputValidator.js';
import _ from 'lodash';
export const loanHelpers = {
  validate: {
    all: function validateAll(
      loan: Pick<
        ILoan,
        'name' | 'description' | 'openedTimestamp' | 'closesTimestamp' | 'initialPrincipal' | 'interestRate'
      >,
    ): Pick<
      ILoan,
      'name' | 'description' | 'openedTimestamp' | 'closesTimestamp' | 'initialPrincipal' | 'interestRate'
    > {
      this.name(loan.name);
      this.description(loan.description);
      this.openedTimestamp(loan.openedTimestamp);
      this.closesTimestamp(loan.closesTimestamp);
      this.amount(loan.initialPrincipal);

      interestRateHelpers.validate.all(loan.interestRate);

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
    initialPrincipal: function validateInitialPrincipal(initialPrincipal: number): number {
      if (
        !isValidAmountOfMoney({
          amount: initialPrincipal,
        })
      )
        throw new Error('(validation) initialPrincipal is invalid!');
      return initialPrincipal;
    },
  },

  sanitize: {
    all: function sanitizeAll(loan: ILoan): void {
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
    if (!_.isString(loan.name)) throw new Error('Type of loan.name must be a string!');
    if (!_.isString(loan.description)) throw new Error('Type of loan.description must be a string!');
    if (!Array.isArray(loan.notes)) throw new Error('Type of loan.notes must be an Array!');
    if (!Number.isFinite(loan.openedTimestamp)) throw new Error('Type of loan.openedTimestamp must be a number!');
    if (!Number.isFinite(loan.closesTimestamp)) throw new Error('Type of loan.closesTimestamp must be a number!');
    if (!Number.isFinite(loan.initialPrincipal)) throw new Error('Type of loan.initialPrincipal must be a number!');
    if (!Number.isFinite(loan.calculatedTotalPaidPrincipal))
      throw new Error('Type of loan.calculatedTotalPaidPrincipal must be a number!');
    if (!Number.isFinite(loan.calculatedChargedInterest))
      throw new Error('Type of loan.calculatedChargedInterest must be a number!');
    if (!Number.isFinite(loan.calculatedPaidInterest))
      throw new Error('Type of loan.calculatedPaidInterest must be a number!');

    interestRateHelpers.runtimeCast(loan.interestRate);

    return {
      _id: loan._id,
      name: loan.name,
      description: loan.description,
      notes: loan.notes,
      openedTimestamp: loan.openedTimestamp,
      closesTimestamp: loan.closesTimestamp,
      interestRate: loan.interestRate,
      initialPrincipal: loan.initialPrincipal,
      calculatedTotalPaidPrincipal: loan.calculatedTotalPaidPrincipal,
      calculatedChargedInterest: loan.calculatedChargedInterest,
      calculatedPaidInterest: loan.calculatedPaidInterest,
    };
  },
};
