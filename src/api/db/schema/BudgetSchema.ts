import mongoose from 'mongoose';

import { LoanInterestRateSchema } from './LoanInterestRateSchema.js';

export const BudgetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  defaultInterestRate: { type: LoanInterestRateSchema },
  calculatedTotalAmount: { type: Number },
  calculatedLendedAmount: { type: Number },
});
