import validator from 'validator';

import { IBudget } from './budgetInterface.js';

export const sanitizeBudget = {
  name: function sanitizeBudgetName(name: string): string {
    name = validator.trim(name);
    name = validator.escape(name);
    return name;
  },
  description: function sanitizeBudgetDescription(description: string): string {
    description = validator.trim(description);
    description = validator.escape(description);
    return description;
  },

  // THIS FUNCTION ONLY FORWARDS TO LOAN SANITIZER
  defaultInterestRate: function sanitizeBudgetDefaultInterestRate(
    defaultInterestRate: Pick<IBudget, 'defaultInterestRate'>,
  ): Pick<IBudget, 'defaultInterestRate'> {
    // TODO
    //defaultInterestRate = sanitizeLoan.defaultInterestRate(defaultInterestRate);
    return defaultInterestRate;
  },
};
