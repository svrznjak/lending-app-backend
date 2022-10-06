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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  notes: { type: [NoteSchema], default: [], required: true },
  openedTimestamp: { type: Number, required: true },
  closesTimestamp: { type: Number, required: true },
  interestRate: { type: LoanInterestRateSchema, required: true },
  initialPrincipal: { type: Number, required: true },
  status: {
    type: String,
    enum: ['ACTIVE', 'PAUSED', 'PAID', 'CLOSED', 'DEFAULTED'],
    required: true,
  },
  calculatedTotalPaidPrincipal: { type: Number },
  calculatedChargedInterest: { type: Number },
  calculatedPaidInterest: { type: Number },
});
