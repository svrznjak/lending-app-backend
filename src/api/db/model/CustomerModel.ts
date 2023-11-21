import mongoose, { ClientSession } from 'mongoose';

import CustomerSchema from '../schema/CustomerSchema.js';
import { ICustomer } from '../../types/customer/customerInterface.js';

export interface ICustomerDocument extends mongoose.Document, Omit<ICustomer, '_id'> {}

interface CustomerModel extends mongoose.Model<ICustomer> {
  existsOneWithId: (id: string, session?: ClientSession) => Promise<boolean>;
}

export default mongoose.model<ICustomer, CustomerModel>('Customers', CustomerSchema);
