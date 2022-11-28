import mongoose from 'mongoose';
import { IBudget } from '../../types/budget/budgetInterface.js';

import { BudgetSchema } from '../schema/BudgetSchema.js';

export interface IBudgetDocument extends mongoose.Document, Omit<IBudget, '_id'> {}

interface BudgetMethods {
  toSimple(): IBudget;
}

// eslint-disable-next-line @typescript-eslint/ban-types
interface BudgetModel extends mongoose.Model<IBudget, {}, BudgetMethods> {
  existsOneWithId: (id: string) => Promise<boolean>;
}

export default mongoose.model<IBudget, BudgetModel>('Budgets', BudgetSchema);
