import mongoose, { ClientSession } from 'mongoose';
import { IBudget } from '../../types/budget/budgetInterface.js';

import { BudgetSchema } from '../schema/BudgetSchema.js';

export interface IBudgetDocument extends mongoose.Document, Omit<IBudget, '_id'> {}

interface BudgetModel extends mongoose.Model<IBudget> {
  existsOneWithId: (id: string, session?: ClientSession) => Promise<boolean>;
}

export default mongoose.model<IBudget, BudgetModel>('Budgets', BudgetSchema);
