import _ from 'lodash';
import { IBudget } from './budgetInterface.js';

import { sanitizeBudget } from './budgetSanitizer.js';
import { interestRateHelpers } from '../interestRate/interestRateHelpers.js';
import { isValidText } from '../../utils/inputValidator/inputValidator.js';
export const budgetHelpers = {
  validate: function validate(
    budget: Pick<IBudget, 'name' | 'description' | 'defaultInterestRate'>,
  ): Pick<IBudget, 'name' | 'description' | 'defaultInterestRate'> {
    if (
      !isValidText({
        text: budget.name,
        validEmpty: false,
        maxLength: 100,
      })
    )
      throw new Error('(validation) Budget.name is invalid!');
    if (
      !isValidText({
        text: budget.description,
        validEmpty: true,
        maxLength: 1000,
      })
    )
      throw new Error('(validation) Budget.description is invalid!');
    interestRateHelpers.validate(budget.defaultInterestRate);

    return budget;
  },

  sanitize: function sanitize(budget: IBudget): void {
    budget.name = sanitizeBudget.name(budget.name);
    budget.description = sanitizeBudget.description(budget.description);
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
