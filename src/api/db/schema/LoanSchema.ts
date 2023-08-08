import mongoose from 'mongoose';
import existsOneWithId from '../plugins/existsOneWithId.js';

import { LoanInterestRateSchema } from './LoanInterestRateSchema.js';
import { LoanPaymentFrequencySchema } from './LoanPaymentFrequencySchema.js';

const NoteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  entryTimestamp: { type: Number, required: true },
});

NoteSchema.add({ revisions: [NoteSchema] });

const ExpectedPaymentSchema = new mongoose.Schema({
  timestamp: { type: Number, required: true },
  principalPayment: { type: Number, required: true },
  interestPayment: { type: Number, required: true },
  notified: { type: Boolean, required: true, default: false },
});

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
    description: { type: String },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customers',
    },
    notes: { type: [NoteSchema], default: [], required: true },
    openedTimestamp: { type: Number, required: true },
    closesTimestamp: { type: Number, required: true },
    interestRate: { type: LoanInterestRateSchema, required: true },
    paymentFrequency: {
      type: LoanPaymentFrequencySchema,
      required: true,
    },
    expectedPayments: {
      type: [ExpectedPaymentSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'PAID', 'COMPLETED', 'DEFAULTED'],
      required: true,
    },
    calculatedInvestedAmount: { type: Number },
    calculatedTotalPaidPrincipal: { type: Number },
    calculatedOutstandingInterest: { type: Number },
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
