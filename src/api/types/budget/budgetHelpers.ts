import _ from 'lodash';
import { IBudget } from './budgetInterface.js';

import { sanitizeText } from './../../utils/inputSanitizer/inputSanitizer.js';
import { interestRateHelpers } from '../interestRate/interestRateHelpers.js';
import { paymentFrequencyHelpers } from '../paymentFrequency/paymentFrequencyHelpers.js';
import { isValidText } from '../../utils/inputValidator/inputValidator.js';
export const budgetHelpers = {
  validate: {
    all: function validateAll(
      budget: Pick<IBudget, 'name' | 'description' | 'defaultInterestRate' | 'defaultPaymentFrequency'>,
    ): Pick<IBudget, 'name' | 'description' | 'defaultInterestRate' | 'defaultPaymentFrequency'> {
      this.name(budget.name);
      this.description(budget.description);
      interestRateHelpers.validate.all(budget.defaultInterestRate);
      paymentFrequencyHelpers.validate.all(budget.defaultPaymentFrequency);

      return budget;
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
  },
  sanitize: {
    all: function sanitizeAll(budget: Partial<IBudget>): void {
      budget.name = this.name(budget.name);
      budget.description = this.description(budget.description);
    },
    name: function sanitizeName(name: string): string {
      return sanitizeText({ text: name });
    },
    description: function sanitizeDescription(description: string): string {
      return sanitizeText({ text: description });
    },
  },

  runtimeCast: function runtimeCast(budget: any): IBudget {
    if (typeof this !== 'object' || this === null) throw new Error('Type of Budget must be an object!');
    if (!_.isString(budget._id)) throw new Error('Type of budget._id must be a string!');
    if (!_.isString(budget.userId)) throw new Error('Type of budget.userId must be a string!');
    if (!_.isString(budget.name)) throw new Error('Type of budget.name must be a string!');
    if (!_.isString(budget.description)) throw new Error('Type of budget.description must be a string!');
    if (!Number.isFinite(budget.calculatedTotalInvestedAmount))
      throw new Error('Type of budget.calculatedTotalInvestedAmount must be a number!');
    if (!Number.isFinite(budget.calculatedTotalWithdrawnAmount))
      throw new Error('Type of budget.calculatedTotalWithdrawnAmount must be a number!');
    if (!Number.isFinite(budget.calculatedTotalAvailableAmount))
      throw new Error('Type of budget.calculatedTotalAvailableAmount must be a number!');
    if (!_.isBoolean(budget.isArchived)) throw new Error('Type of budget.isArchived must be a boolean!');

    interestRateHelpers.runtimeCast(budget.defaultInterestRate);
    paymentFrequencyHelpers.runtimeCast(budget.defaultPaymentFrequency);

    return {
      _id: budget._id,
      userId: budget.userId,
      name: budget.name,
      description: budget.description,
      defaultInterestRate: budget.defaultInterestRate,
      defaultPaymentFrequency: budget.defaultPaymentFrequency,
      calculatedTotalInvestedAmount: budget.calculatedTotalInvestedAmount,
      calculatedTotalWithdrawnAmount: budget.calculatedTotalWithdrawnAmount,
      calculatedTotalAvailableAmount: budget.calculatedTotalAvailableAmount,
      isArchived: budget.isArchived,
    };
  },
};
