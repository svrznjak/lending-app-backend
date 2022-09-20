import _ from 'lodash';
import { IBudget } from './budgetInterface.js';

import { sanitizeText } from './../../utils/inputSanitizer/inputSanitizer.js';
import { interestRateHelpers } from '../interestRate/interestRateHelpers.js';
import { isValidText } from '../../utils/inputValidator/inputValidator.js';
export const budgetHelpers = {
  validate: {
    all: function validateAll(
      budget: Pick<IBudget, 'name' | 'description' | 'defaultInterestRate'>,
    ): Pick<IBudget, 'name' | 'description' | 'defaultInterestRate'> {
      this.name(budget.name);
      this.description(budget.description);
      if (budget.defaultInterestRate !== undefined) interestRateHelpers.validate.all(budget.defaultInterestRate);

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
    if (!_.isString(budget.name)) throw new Error('Type of budget.name must be a string!');
    if (!_.isString(budget.description)) throw new Error('Type of budget.description must be a string!');
    if (!Number.isFinite(budget.calculatedTotalAmount))
      throw new Error('Type of budget.calculatedTotalAmount must be a number!');
    if (!Number.isFinite(budget.calculatedLendedAmount))
      throw new Error('Type of budget.calculatedLendedAmount must be a number!');

    interestRateHelpers.runtimeCast(budget.defaultInterestRate);

    return {
      _id: budget._id,
      name: budget.name,
      description: budget.description,
      defaultInterestRate: budget.defaultInterestRate,
      calculatedTotalAmount: budget.calculatedTotalAmount,
      calculatedLendedAmount: budget.calculatedLendedAmount,
    };
  },
};
