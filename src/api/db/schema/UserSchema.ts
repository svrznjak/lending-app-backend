import mongoose from 'mongoose';

import { BudgetSchema } from './BudgetSchema.js';
import { LoanSchema } from './LoanSchema.js';

const SubscriptionSchema = new mongoose.Schema({
  revenuecatId: { type: String, required: true },
  type: {
    type: String,
    enum: ['FREE', 'STANDARD', 'PREMIUM'],
    required: true,
  },
});

export default new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  firebaseId: { type: String, required: true },
  budgets: { type: [BudgetSchema], default: [], required: true },
  loans: { type: [LoanSchema], default: [], required: true },
  currency: { type: String, required: true },
  language: { type: String, required: true },
  timezone: { type: String, required: true },
  subscription: SubscriptionSchema,
});
