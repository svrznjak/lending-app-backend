import mongoose from 'mongoose';
import existsOneWithId from '../plugins/existsOneWithId.js';

import { LoanInterestRateSchema } from './LoanInterestRateSchema.js';

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
    description: { type: String, required: true },
    defaultInterestRate: { type: LoanInterestRateSchema },
    calculatedTotalInvestedAmount: { type: Number },
    calculatedTotalWithdrawnAmount: { type: Number },
    calculatedTotalAvailableAmount: { type: Number },
    isArchived: { type: Boolean, required: true },
  },
  {
    statics: {
      existsOneWithId,
    },
  },
);
