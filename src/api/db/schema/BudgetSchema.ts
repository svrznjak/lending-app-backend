import mongoose from 'mongoose';
import { IBudget } from '../../types/budget/budgetInterface.js';
import existsOneWithId from '../plugins/existsOneWithId.js';

import { LoanInterestRateSchema } from './LoanInterestRateSchema.js';

export const BudgetSchema = new mongoose.Schema(
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
    defaultInterestRate: { type: LoanInterestRateSchema },
    calculatedTotalInvestedAmount: { type: Number },
    calculatedTotalWithdrawnAmount: { type: Number },
    calculatedTotalAvailableAmount: { type: Number },
    isArchived: { type: Boolean, required: true },
  },
  {
    statics: {
      existsOneWithId,
    },
    methods: {
      toSimple: function toSimple(): IBudget {
        const MONGO_BUDGET: any = this.toObject();
        return {
          _id: MONGO_BUDGET._id.toString(),
          userId: MONGO_BUDGET.userId.toString(),
          name: MONGO_BUDGET.name,
          description: MONGO_BUDGET.description,
          defaultInterestRate: {
            type: MONGO_BUDGET.defaultInterestRate.type,
            duration: MONGO_BUDGET.defaultInterestRate.duration,
            expectedPayments: MONGO_BUDGET.defaultInterestRate.expectedPayments,
            amount: MONGO_BUDGET.defaultInterestRate.amount,
            isCompounding: MONGO_BUDGET.defaultInterestRate.isCompounding,
            entryTimestamp: MONGO_BUDGET.defaultInterestRate.entryTimestamp,
            revisions:
              MONGO_BUDGET.defaultInterestRate.revisions !== undefined
                ? {
                    type: MONGO_BUDGET.defaultInterestRate.revisions.type,
                    duration: MONGO_BUDGET.defaultInterestRate.revisions.duration,
                    expectedPayments: MONGO_BUDGET.defaultInterestRate.revisions.expectedPayments,
                    amount: MONGO_BUDGET.defaultInterestRate.revisions.amount,
                    isCompounding: MONGO_BUDGET.defaultInterestRate.revisions.isCompounding,
                    entryTimestamp: MONGO_BUDGET.defaultInterestRate.revisions.entryTimestamp,
                    revisions: MONGO_BUDGET.defaultInterestRate.revisions.revisions,
                  }
                : undefined,
          },
          calculatedTotalInvestedAmount: MONGO_BUDGET.calculatedTotalInvestedAmount,
          calculatedTotalWithdrawnAmount: MONGO_BUDGET.calculatedTotalWithdrawnAmount,
          calculatedTotalAvailableAmount: MONGO_BUDGET.calculatedTotalAvailableAmount,
          isArchived: MONGO_BUDGET.isArchived,
        };
      },
    },
  },
);
