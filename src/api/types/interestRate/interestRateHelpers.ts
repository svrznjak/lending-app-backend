import _ from 'lodash';
import { isValidAmountOfMoney, isValidOption, isValidTimestamp } from '../../utils/inputValidator/inputValidator.js';
import { IInterestRate } from './interestRateInterface.js';

export const interestRateHelpers = {
  validate: function validate(interestRate: IInterestRate): IInterestRate {
    if (
      !isValidOption({
        option: interestRate.type,
        validOptions: ['PERCENTAGE_PER_DURATION', 'FIXED_PER_DURATION'],
        caseSensitive: true,
      })
    )
      throw new Error('(validation) interestRate.type is invalid!');
    if (
      !isValidOption({
        option: interestRate.duration,
        validOptions: ['DAY', 'WEEK', 'MONTH', 'YEAR', 'FULL_DURATION'],
        caseSensitive: true,
      })
    )
      throw new Error('(validation) interestRate.duration is invalid!');
    if (!isValidAmountOfMoney({ amount: interestRate.amount }))
      throw new Error('(validation) interestRate.amount is invalid!');
    if (!isValidTimestamp({ timestamp: interestRate.entryTimestamp }))
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
    if (!_.isObject(interestRate.revisions) && interestRate.revisions !== undefined)
      throw new Error('Type of interestRate.revisions must be an object or undefined!');
    return {
      type: interestRate.type,
      duration: interestRate.duration,
      amount: interestRate.amount,
      entryTimestamp: interestRate.entryTimestamp,
      revisions: interestRate.revisions,
    };
  },
};
