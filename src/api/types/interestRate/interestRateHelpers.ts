import _ from 'lodash';
import { isValidAmountOfMoney, isValidOption, isValidTimestamp } from '../../utils/inputValidator/inputValidator.js';
import { IInterestRate } from './interestRateInterface.js';

export const interestRateHelpers = {
  validate: {
    all: function validateAll(
      interestRate: Pick<IInterestRate, 'type' | 'duration' | 'amount' | 'entryTimestamp'>,
    ): Pick<IInterestRate, 'type' | 'duration' | 'amount' | 'entryTimestamp'> {
      this.type(interestRate.type);
      this.duration(interestRate.duration);
      this.amount(interestRate.amount);
      this.entryTimestamp(interestRate.entryTimestamp);

      return interestRate;
    },
    type: function validateType(type: string): string {
      if (
        !isValidOption({
          option: type,
          validOptions: ['PERCENTAGE_PER_DURATION', 'FIXED_PER_DURATION'],
          caseSensitive: true,
        })
      )
        throw new Error('(validation) type is invalid!');
      return type;
    },
    duration: function validateDuration(duration: string): string {
      if (
        !isValidOption({
          option: duration,
          validOptions: ['DAY', 'WEEK', 'MONTH', 'YEAR', 'FULL_DURATION'],
          caseSensitive: true,
        })
      )
        throw new Error('(validation) duration is invalid!');
      return duration;
    },
    amount: function validateAmount(amount: number): number {
      if (!isValidAmountOfMoney({ amount: amount })) throw new Error('(validation) amount is invalid!');
      return amount;
    },
    entryTimestamp: function validateEntryTimestamp(entryTimestamp: number): number {
      if (!isValidTimestamp({ timestamp: entryTimestamp }) && entryTimestamp !== undefined)
        throw new Error('(validation) entryTimestamp is invalid!');
      return entryTimestamp;
    },
  },

  runtimeCast: function runtimeCast(interestRate: any): IInterestRate {
    if (typeof interestRate !== 'object' || interestRate === null)
      throw new Error('Type of interestRate must be an object!');
    if (!_.isString(interestRate.type)) throw new Error('Type of interestRate.type must be a string!');
    if (!_.isString(interestRate.duration)) throw new Error('Type of interestRate.duration must be a string!');
    if (!Number.isFinite(interestRate.amount)) throw new Error('Type of interestRate.amount must be a number!');
    if (!_.isBoolean(interestRate.isCompounding))
      throw new Error('Type of interestRate.isCompounding must be a boolean!');
    if (!Number.isFinite(interestRate.entryTimestamp) && interestRate.entryTimestamp !== undefined)
      throw new Error('Type of interestRate.entryTimestamp must be a number!');
    if (!_.isPlainObject(interestRate.revisions) && interestRate.revisions !== undefined)
      throw new Error('Type of interestRate.revisions must be an object or undefined!');
    return {
      type: interestRate.type,
      duration: interestRate.duration,
      amount: interestRate.amount,
      isCompounding: interestRate.isCompounding,
      entryTimestamp: interestRate.entryTimestamp,
      revisions: interestRate.revisions,
    };
  },
};
