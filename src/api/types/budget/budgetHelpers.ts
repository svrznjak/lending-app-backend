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
    if (!_.isBoolean(budget.isArchived)) throw new Error('Type of budget.isArchived must be a boolean!');

    interestRateHelpers.runtimeCast(budget.defaultInterestRate);
    paymentFrequencyHelpers.runtimeCast(budget.defaultPaymentFrequency);

    checkBudgetStats(budget.currentStats);

    if (budget.transactionList !== undefined && !_.isArray(budget.transactionList))
      throw new Error('Type of budget.transactionList must be an array!');
    if (_.isArray(budget.transactionList))
      budget.transactionList.forEach((transaction: any) => {
        if (transaction._id === undefined) throw new Error('Type of budget.transactionList._id must be defined!');
        if (!Number.isFinite(transaction.amount))
          throw new Error('Type of budget.transactionList.amount must be a number!');
        if (!_.isString(transaction.description))
          throw new Error('Type of budget.transactionList.description must be a string!');
        if (!Number.isFinite(transaction.timestamp))
          throw new Error('Type of budget.transactionList.timestamp must be a number!');

        checkBudgetStats(transaction.budgetStats);
      });
    return {
      _id: budget._id,
      userId: budget.userId,
      name: budget.name,
      description: budget.description,
      defaultInterestRate: budget.defaultInterestRate,
      defaultPaymentFrequency: budget.defaultPaymentFrequency,
      isArchived: budget.isArchived,
      currentStats: budget.currentStats,
      transactionList: budget.transactionList,
    };
  },
};

function checkBudgetStats(budgetStats: any): void {
  if (!Number.isFinite(budgetStats.totalInvestedAmount))
    throw new Error('Type of budget.calculatedTotalInvestedAmount must be a number!');
  if (!Number.isFinite(budgetStats.totalWithdrawnAmount))
    throw new Error('Type of budget.calculatedTotalWithdrawnAmount must be a number!');
  if (!Number.isFinite(budgetStats.totalAvailableAmount))
    throw new Error('Type of budget.calculatedTotalAvailableAmount must be a number!');
  if (!Number.isFinite(budgetStats.currentlyPaidBackPrincipalAmount))
    throw new Error('Type of budget.calculatedCurrentlyPaidBackPrincipalAmount must be a number!');
  if (!Number.isFinite(budgetStats.currentlyEarnedInterestAmount))
    throw new Error('Type of budget.calculatedCurrentlyEarnedInterestAmount must be a number!');
  if (!Number.isFinite(budgetStats.currentlyEarnedFeesAmount))
    throw new Error('Type of budget.calculatedCurrentlyEarnedFeesAmount must be a number!');
  if (!Number.isFinite(budgetStats.currentlyLendedPrincipalToLiveLoansAmount))
    throw new Error('Type of budget.calculatedCurrentlyLendedPrincipalToLiveLoansAmount must be a number!');
  if (!Number.isFinite(budgetStats.totalLostPrincipalToCompletedAndDefaultedLoansAmount))
    throw new Error('Type of budget.calculatedTotalLostPrincipalToCompletedAndDefaultedLoansAmount must be a number!');
  if (!Number.isFinite(budgetStats.totalGains))
    throw new Error('Type of budget.calculatedTotalGains must be a number!');
  if (!Number.isFinite(budgetStats.totalForgivenAmount))
    throw new Error('Type of budget.calculatedTotalForgivenAmount must be a number!');
  if (!Number.isFinite(budgetStats.totalLentAmount))
    throw new Error('Type of budget.calculatedTotalLentAmount must be a number!');
  if (!Number.isFinite(budgetStats.totalAssociatedLoans))
    throw new Error('Type of budget.calculatedTotalAssociatedLoans must be a number!');
  if (!Number.isFinite(budgetStats.totalAssociatedLiveLoans))
    throw new Error('Type of budget.calculatedTotalAssociatedLiveLoans must be a number!');
  if (
    !Number.isFinite(budgetStats.avarageAssociatedLoanDuration) &&
    budgetStats.avarageAssociatedLoanDuration !== undefined &&
    budgetStats.avarageAssociatedLoanDuration !== null
  )
    throw new Error('Type of budget.calculatedAvarageAssociatedLoanDuration must be a number or undefined!');
  if (
    !Number.isFinite(budgetStats.avarageAssociatedLoanAmount) &&
    budgetStats.avarageAssociatedLoanAmount !== undefined &&
    budgetStats.avarageAssociatedLoanAmount !== null
  )
    throw new Error('Type of budget.calculatedAvarageAssociatedLoanAmount must be a number or undefined!');
}
