import mongoose from 'mongoose';

import TransactionSchema from '../schema/TransactionSchema.js';

export default mongoose.model('Transactions', TransactionSchema);
