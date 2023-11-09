import mongoose from 'mongoose';
import existsOneWithId from '../plugins/existsOneWithId.js';

import { LoanInterestRateSchema } from './LoanInterestRateSchema.js';
import { LoanPaymentFrequencySchema } from './LoanPaymentFrequencySchema.js';

/*const BudgetStatsSchema = new mongoose.Schema({
  totalInvestedAmount: { type: Number, default: 0 },
  totalWithdrawnAmount: { type: Number, default: 0 },
  totalAvailableAmount: { type: Number, default: 0 },
  currentlyLendedPrincipalToLiveLoansAmount: { type: Number, default: 0 },
  currentlyEarnedInterestAmount: { type: Number, default: 0 },
  totalLostPrincipalToCompletedAndDefaultedLoansAmount: { type: Number, default: 0 },
  totalGains: { type: Number, default: 0 },
  totalForgivenAmount: { type: Number, default: 0 },
  totalLentAmount: { type: Number, default: 0 },
  totalAssociatedLoans: { type: Number, default: 0 },
  totalAssociatedLiveLoans: { type: Number, default: 0 },
  avarageAssociatedLoanDuration: { type: Number, default: null },
  avarageAssociatedLoanAmount: { type: Number, default: null },
});*/

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
    isArchived: { type: Boolean, required: true },
  },
  {
    statics: {
      existsOneWithId,
    },
  },
);
