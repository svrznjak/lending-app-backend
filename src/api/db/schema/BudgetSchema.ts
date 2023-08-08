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
    calculatedTotalInvestedAmount: { type: Number },
    calculatedTotalWithdrawnAmount: { type: Number },
    calculatedTotalAvailableAmount: { type: Number },
    calculatedTotalLendedPrincipalToActiveLoansAmount: { type: Number },
    calculatedTotalLostPrincipalToCompletedAndDefaultedLoansAmount: { type: Number },
    calculatedTotalProfitAmount: { type: Number },
    isArchived: { type: Boolean, required: true },
  },
  {
    statics: {
      existsOneWithId,
    },
  },
);
