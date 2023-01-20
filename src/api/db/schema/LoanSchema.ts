import mongoose from 'mongoose';
import existsOneWithId from '../plugins/existsOneWithId.js';

import { LoanInterestRateSchema } from './LoanInterestRateSchema.js';

const NoteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  entryTimestamp: { type: Number, required: true },
});

NoteSchema.add({ revisions: [NoteSchema] });

export const LoanSchema = new mongoose.Schema(
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
    notes: { type: [NoteSchema], default: [], required: true },
    openedTimestamp: { type: Number, required: true },
    closesTimestamp: { type: Number, required: true },
    interestRate: { type: LoanInterestRateSchema, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'PAID', 'CLOSED', 'DEFAULTED'],
      required: true,
    },
    calculatedInvestedAmount: { type: Number },
    calculatedTotalPaidPrincipal: { type: Number },
    calculatedChargedInterest: { type: Number },
    calculatedPaidInterest: { type: Number },
    calculatedLastTransactionTimestamp: { type: Number },
    calculatedRelatedBudgets: {
      type: [
        {
          _id: false,
          budgetId: { type: String, required: true },
          invested: { type: Number, default: 0 },
          withdrawn: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
  },
  {
    statics: {
      existsOneWithId,
    },
  },
);
