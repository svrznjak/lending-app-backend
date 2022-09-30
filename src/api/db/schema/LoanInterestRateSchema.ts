import mongoose from 'mongoose';

const LoanInterestRate = new mongoose.Schema({
  type: {
    type: String,
    enum: ['PERCENTAGE_PER_DURATION', 'FIXED_PER_DURATION'],
    required: true,
  },
  duration: {
    type: String,
    enum: ['DAY', 'WEEK', 'MONTH', 'YEAR', 'FULL_DURATION'],
    required: true,
  },
  expectedPayments: {
    type: String,
    enum: ['ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
    required: true,
  },
  amount: { type: Number, required: true },
  isCompound: { type: Boolean, required: true },
  entryTimestamp: { type: Number, required: true },
});

LoanInterestRate.add({ revisions: LoanInterestRate });
export const LoanInterestRateSchema = LoanInterestRate;
