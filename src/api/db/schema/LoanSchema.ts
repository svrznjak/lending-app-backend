import mongoose from 'mongoose';
import existsOneWithId from '../plugins/existsOneWithId.js';

import { LoanPaymentFrequencySchema } from './LoanPaymentFrequencySchema.js';
import { NoteSchema } from './NoteSchema.js';
import { LoanInterestRateSchema } from './LoanInterestRateSchema.js';

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
  paymentDate: { type: Number, required: true },
  outstandingPrincipalBeforePayment: { type: Number, required: true },
  totalPaidPrincipalBeforePayment: { type: Number, required: true },
  principalPayment: { type: Number, required: true },
  interestPayment: { type: Number, required: true },
  notified: { type: Boolean, required: true, default: false },
});

const PaymentDetailsSchema = new mongoose.Schema({
  budgetId: { type: String },
  amount: { type: Number, required: true },
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
    paymentFrequency: {
      type: LoanPaymentFrequencySchema,
      required: true,
    },
    expectedPayments: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      type: [ExpectedPaymentSchema],
      default: [],
    },
    status: {
      type: LoanStatusSchema,
      required: true,
    },
    calculatedInvestedAmount: { type: Number },
    calculatedOutstandingPrincipal: { type: Number },
    calculatedTotalPaidPrincipal: { type: Number },
    calculatedOutstandingInterest: { type: Number },
    calculatedOutstandingFees: { type: Number },
    calculatedPaidInterest: { type: Number },
    calculatedPaidFees: { type: Number },
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
          totalPaidFees: { type: Number },
          totalForgiven: { type: Number },
          from: {
            type: {
              datatype: {
                type: String,
                enum: ['BUDGET', 'LOAN', 'FEE', 'OUTSIDE', 'FORGIVENESS'],
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
                enum: ['BUDGET', 'LOAN', 'FEE', 'OUTSIDE', 'FORGIVENESS'],
              },
              addressId: {
                type: String,
              },
            },
          },
          invested: { type: Number },
          feeCharged: { type: Number },
          interestCharged: { type: Number },
          principalPaid: { type: [PaymentDetailsSchema], default: [] },
          interestPaid: { type: [PaymentDetailsSchema], default: [] },
          feePaid: { type: [PaymentDetailsSchema], default: [] },
          refundedAmount: { type: [PaymentDetailsSchema], default: [] },
          forgivenAmount: { type: [PaymentDetailsSchema], default: [] },
          outstandingPrincipal: { type: Number },
          outstandingInterest: { type: Number },
          outstandingFees: { type: Number },
          investmentStats: {
            type: [
              {
                budgetId: { type: String, required: true },
                initialInvestment: { type: Number, required: true },
                outstandingPrincipal: { type: Number, required: true },
                totalPaidPrincipal: { type: Number, required: true },
                outstandingInterest: { type: Number, required: true },
                totalPaidInterest: { type: Number, required: true },
                totalForgivenAmount: { type: Number, required: true },
                interestRate: {
                  type: LoanInterestRateSchema,
                  required: true,
                },
              },
            ],
            default: [],
          },
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
