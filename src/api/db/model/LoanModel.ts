import mongoose from 'mongoose';

import { LoanSchema } from '../schema/LoanSchema.js';

export default mongoose.model('Loans', LoanSchema);
