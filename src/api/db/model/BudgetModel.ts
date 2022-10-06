import mongoose from 'mongoose';

import { BudgetSchema } from '../schema/BudgetSchema.js';

export default mongoose.model('Budgets', BudgetSchema);
