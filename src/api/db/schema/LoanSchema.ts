import mongoose from 'mongoose';
import existsOneWithId from '../plugins/existsOneWithId.js';

import { LoanInterestRateSchema } from './LoanInterestRateSchema.js';
import { LoanPaymentFrequencySchema } from './LoanPaymentFrequencySchema.js';

const NoteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  entryTimestamp: { type: Number, required: true },
});

NoteSchema.add({ revisions: [NoteSchema] });

const LoanStatusSchema = new mongoose.Schema({
  current: {
    type: String,
    enum: ['ACTIVE', 'PAUSED', 'PAID', 'COMPLETED', 'DEFAULTED'],
    required: true,
  },
  timestamp: { type: Number, required: true },
});

LoanStatusSchema.add({ previous: LoanStatusSchema });

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
      type: LoanStatusSchema,
      required: true,
    },
    calculatedInvestedAmount: { type: Number },
    calculatedTotalPaidPrincipal: { type: Number },
    calculatedOutstandingInterest: { type: Number },
    calculatedPaidInterest: { type: Number },
    calculatedTotalForgiven: { type: Number },
    calculatedLastTransactionTimestamp: { type: Number },
    calculatedRelatedBudgets: {
      type: [
        {
          //_id: false,
          _id: {
            type: mongoose.Schema.Types.ObjectId,
          },
          budgetId: { type: String, required: true },
          invested: { type: Number, default: 0 },
          withdrawn: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    transactionList: {
      type: [
        {
          _id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Transactions',
          },
          timestamp: { type: Number },
          description: { type: String },
          totalInvested: { type: Number },
          totalPaidPrincipal: { type: Number },
          totalPaidInterest: { type: Number },
          totalRefunded: { type: Number },
          totalForgiven: { type: Number },
          from: {
            type: {
              datatype: {
                type: String,
                enum: ['BUDGET', 'LOAN', 'INTEREST', 'OUTSIDE', 'FORGIVENESS'],
              },
              addressId: {
                type: String,
              },
            },
          },
          to: {
            type: {
              datatype: {
                type: String,
                enum: ['BUDGET', 'LOAN', 'INTEREST', 'OUTSIDE', 'FORGIVENESS'],
              },
              addressId: {
                type: String,
              },
            },
          },
          invested: { type: Number },
          feeCharged: { type: Number },
          interestCharged: { type: Number },
          principalPaid: { type: Number },
          interestPaid: { type: Number },
          refundedAmount: { type: Number },
          forgivenAmount: { type: Number },
          outstandingPrincipal: { type: Number },
          outstandingInterest: { type: Number },
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
