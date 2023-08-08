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
  amount: { type: Number, required: true },
  isCompounding: { type: Boolean, required: true },
  entryTimestamp: { type: Number, default: Date.now() },
});

LoanInterestRate.add({ revisions: LoanInterestRate });
export const LoanInterestRateSchema = LoanInterestRate;
