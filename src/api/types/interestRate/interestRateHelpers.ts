import _ from 'lodash';
import { IInterestRate } from './interestRateInterface.js';

import { validateInterestRate } from './interestRateValidator.js';

export const interestRateHelpers = {
  validate: function validate(interestRate: IInterestRate): IInterestRate {
    if (!validateInterestRate.isValidType(interestRate.type))
      throw new Error('(validation) interestRate.type is invalid!');
    if (!validateInterestRate.isValidDuration(interestRate.duration))
      throw new Error('(validation) interestRate.duration is invalid!');
    if (!validateInterestRate.isValidAmount(interestRate.amount))
      throw new Error('(validation) interestRate.amount is invalid!');
    if (!validateInterestRate.isValidEntryTimestamp(interestRate.entryTimestamp))
      throw new Error('(validation) interestRate.entryTimestamp is invalid!');

    return interestRate;
  },

  runtimeCast: function runtimeCast(interestRate: any): IInterestRate {
    if (typeof interestRate !== 'object' || interestRate === null)
      throw new Error('Type of interestRate must be an object!');
    if (!_.isString(interestRate.type)) throw new Error('Type of interestRate.type must be a string!');
    if (!_.isString(interestRate.duration)) throw new Error('Type of interestRate.duration must be a string!');
    if (!Number.isFinite(interestRate.amount)) throw new Error('Type of interestRate.amount must be a number!');
    if (!Number.isFinite(interestRate.entryTimestamp))
      throw new Error('Type of interestRate.entryTimestamp must be a number!');
    if (!Array.isArray(interestRate.revisions)) throw new Error('Type of interestRate.revisions must be an array!');

    return {
      type: interestRate.type,
      duration: interestRate.duration,
      amount: interestRate.amount,
      entryTimestamp: interestRate.entryTimestamp,
      revisions: interestRate.revisions,
    };
  },
};
