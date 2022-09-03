import mongoose from 'mongoose';

import { LoanInterestRateSchema } from './Loan.js';

export const BudgetSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  defaultInterestRate: { type: LoanInterestRateSchema },
  calculatedTotalAmount: { type: Number },
  calculatedLendedAmount: { type: Number },
});
