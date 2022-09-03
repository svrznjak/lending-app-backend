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
  entryTimestamp: { type: Number, required: true },
});

LoanInterestRate.add({ revisions: [LoanInterestRate] });
export const LoanInterestRateSchema = LoanInterestRate;

const NoteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdAtTimestamp: { type: Number, required: true },
});

NoteSchema.add({ revisions: [NoteSchema] });

export const LoanSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  notes: { type: [NoteSchema], default: [], required: true },
  startedOn: { type: Number, required: true },
  closesAt: { type: Number, required: true },
  interestRate: { type: LoanInterestRateSchema, required: true },
  calculatedTotalPaidPrincipal: { type: Number },
  calculatedChargedInterest: { type: Number },
  calculatedPaidInterest: { type: Number },
});
