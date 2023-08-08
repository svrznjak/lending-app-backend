import { isValidOption } from '../../utils/inputValidator/inputValidator.js';
import { IPaymentFrequency } from './paymentFrequencyInterface.js';

import _ from 'lodash';

export const paymentFrequencyHelpers = {
  validate: {
    all: function validateAll(paymentFrequency: IPaymentFrequency): IPaymentFrequency {
      this.occurrence(paymentFrequency.occurrence);
      this.isStrict(paymentFrequency.isStrict);
      if (paymentFrequency.isStrict === true) {
        this.strictValue(paymentFrequency.strictValue);
      }
      this.entryTimestamp(paymentFrequency.entryTimestamp);
      return paymentFrequency;
    },
    occurrence: function validateOccurrence(occurrence: string): string {
      if (
        !isValidOption({
          option: occurrence,
          validOptions: ['ONE_TIME', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
          caseSensitive: true,
        })
      )
        throw new Error('(validation) occurrence is invalid!');
      return occurrence;
    },
    isStrict: function validateIsStrict(isStrict: boolean): boolean {
      if (!_.isBoolean(isStrict)) throw new Error('(validation) isStrict is invalid!');
      return isStrict;
    },
    strictValue: function validateStrictValue(strictValue: string): string {
      if (
        !isValidOption({
          option: strictValue,
          validOptions: [
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '10',
            '11',
            '12',
            '13',
            '14',
            '15',
            '16',
            '17',
            '18',
            '19',
            '20',
            '21',
            '22',
            '23',
            '24',
            '25',
            '26',
            '27',
            '28',
            '29',
            '30',
            '31',
          ],
          caseSensitive: true,
        })
      )
        throw new Error('(validation) strictValue is invalid!');
      return strictValue;
    },
    entryTimestamp: function validateEntryTimestamp(entryTimestamp: number): number {
      if (!Number.isFinite(entryTimestamp)) throw new Error('(validation) entryTimestamp is invalid!');
      return entryTimestamp;
    },
  },
  runtimeCast: function runtimeCast(paymentFrequency: any): IPaymentFrequency {
    if (typeof paymentFrequency !== 'object' || paymentFrequency === null)
      throw new Error('Type of loan.paymentFrequency must be an object!');
    if (!_.isString(paymentFrequency.occurrence))
      throw new Error('Type of loan.paymentFrequency.occurrence must be a string!');
    if (!_.isBoolean(paymentFrequency.isStrict))
      throw new Error('Type of loan.paymentFrequency.isStrict must be a boolean!');
    if (paymentFrequency.isStrict === true) {
      if (!_.isString(paymentFrequency.strictValue))
        throw new Error('Type of loan.paymentFrequency.strictValue must be a string!');
    }
    if (!Number.isFinite(paymentFrequency.entryTimestamp))
      throw new Error('Type of loan.paymentFrequency.entryTimestamp must be a number!');

    return {
      occurrence: paymentFrequency.occurrence,
      isStrict: paymentFrequency.isStrict,
      strictValue: paymentFrequency.strictValue,
      entryTimestamp: paymentFrequency.entryTimestamp,
      revisions: paymentFrequency.revisions,
    };
  },
};
