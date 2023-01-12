import mongoose, { ClientSession } from 'mongoose';
import { ILoan } from '../../types/loan/loanInterface.js';

import { LoanSchema } from '../schema/LoanSchema.js';

export interface ILoanDocument extends mongoose.Document, Omit<ILoan, '_id'> {}

interface LoanModel extends mongoose.Model<ILoan> {
  existsOneWithId: (id: string, session?: ClientSession) => Promise<boolean>;
}

export default mongoose.model<ILoan, LoanModel>('Loans', LoanSchema);
