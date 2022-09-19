import mongoose from 'mongoose';

import { LoanInterestRateSchema } from './LoanInterestRateSchema.js';

const NoteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  entryTimestamp: { type: Number, required: true },
});

NoteSchema.add({ revisions: [NoteSchema] });

export const LoanSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
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
