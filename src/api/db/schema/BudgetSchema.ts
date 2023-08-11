import mongoose from 'mongoose';
import existsOneWithId from '../plugins/existsOneWithId.js';

import { LoanInterestRateSchema } from './LoanInterestRateSchema.js';
import { LoanPaymentFrequencySchema } from './LoanPaymentFrequencySchema.js';

export const BudgetSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Users',
    },
    name: { type: String, required: true },
    description: { type: String },
    defaultInterestRate: { type: LoanInterestRateSchema },
    defaultPaymentFrequency: { type: LoanPaymentFrequencySchema },
    calculatedTotalInvestedAmount: { type: Number, default: 0 },
    calculatedTotalWithdrawnAmount: { type: Number, default: 0 },
    calculatedTotalAvailableAmount: { type: Number, default: 0 },
    calculatedCurrentlyLendedPrincipalToLiveLoansAmount: { type: Number, default: 0 },
    calculatedCurrentlyEarnedInterestAmount: { type: Number, default: 0 },
    calculatedTotalLostPrincipalToCompletedAndDefaultedLoansAmount: { type: Number, default: 0 },
    calculatedTotalGains: { type: Number, default: 0 },
    calculatedTotalLentAmount: { type: Number, default: 0 },
    calculatedTotalAssociatedLoans: { type: Number, default: 0 },
    calculatedTotalAssociatedLiveLoans: { type: Number, default: 0 },
    calculatedAvarageAssociatedLoanDuration: { type: Number, default: null },
    calculatedAvarageAssociatedLoanAmount: { type: Number, default: null },
    isArchived: { type: Boolean, required: true },
  },
  {
    statics: {
      existsOneWithId,
    },
  },
);
