import mongoose from 'mongoose';

const TransactionAddressSchema = new mongoose.Schema({
  datatype: {
    type: String,
    enum: ['BUDGET', 'LOAN', 'INTEREST', 'OUTSIDE'],
    required: true,
  },
  addressId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
});

const TransactionSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  transactionTimestamp: { type: Number, required: true },
  description: { type: String, required: true },
  from: { type: TransactionAddressSchema, required: true },
  to: { type: TransactionAddressSchema, required: true },
  amount: { type: Number, required: true },
  entryTimestamp: { type: Number, required: true },
});

TransactionSchema.add({ revisions: [TransactionSchema] });
export default TransactionSchema;
