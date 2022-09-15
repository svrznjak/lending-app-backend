import { isValidTimestamp, isValidAmountOfMoney } from './../../utils/inputValidator/inputValidator.js';
import { ILoan } from './loanInterface.js';

import { sanitizeText } from './../../utils/inputSanitizer/inputSanitizer.js';
import { interestRateHelpers } from '../interestRate/interestRateHelpers.js';
import { isValidText } from '../../utils/inputValidator/inputValidator.js';
import _ from 'lodash';
export const loanHelpers = {
  validate: function validate(
    loan: Pick<
      ILoan,
      'name' | 'description' | 'openedTimestamp' | 'closesTimestamp' | 'initialPrincipal' | 'interestRate'
    >,
  ): Pick<ILoan, 'name' | 'description' | 'openedTimestamp' | 'closesTimestamp' | 'initialPrincipal' | 'interestRate'> {
    if (
      !isValidText({
        text: loan.name,
        validEmpty: false,
        maxLength: 100,
      })
    )
      throw new Error('(validation) Loan.name is invalid!');
    if (
      !isValidText({
        text: loan.description,
        validEmpty: true,
        maxLength: 1000,
      })
    )
      throw new Error('(validation) Loan.description is invalid!');

    if (
      !isValidTimestamp({
        timestamp: loan.openedTimestamp,
      })
    )
      throw new Error('(validation) Loan.openedTimestamp is invalid!');
    if (
      !isValidTimestamp({
        timestamp: loan.closesTimestamp,
      })
    )
      throw new Error('(validation) Loan.closesTimestamp is invalid!');
    if (
      !isValidAmountOfMoney({
        amount: loan.initialPrincipal,
      })
    )
      throw new Error('(validation) Loan.initialPrincipal is invalid!');
    interestRateHelpers.validate(loan.interestRate);

    return loan;
  },

  sanitize: function sanitize(loan: ILoan): void {
    loan.name = sanitizeText({ text: loan.name });
    loan.description = sanitizeText({ text: loan.description });
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
