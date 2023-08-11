import mongoose from 'mongoose';
import existsOneWithId from '../plugins/existsOneWithId.js';

export const TransactionAddressSchema = new mongoose.Schema({
  datatype: {
    type: String,
    enum: ['BUDGET', 'LOAN', 'INTEREST', 'OUTSIDE'],
    required: true,
  },
  addressId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
});

const TransactionSchema = new mongoose.Schema(
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
    transactionTimestamp: { type: Number, required: true },
    description: { type: String },
    from: { type: TransactionAddressSchema, required: true },
    to: { type: TransactionAddressSchema, required: true },
    refund: { type: Boolean, default: false },
    amount: { type: Number, required: true },
    entryTimestamp: { type: Number, required: true },
  },
  {
    statics: {
      existsOneWithId,
    },
  },
);

TransactionSchema.add({ revisions: TransactionSchema });
export default TransactionSchema;
