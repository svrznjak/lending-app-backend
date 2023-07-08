import mongoose from 'mongoose';
import existsOneWithId from '../plugins/existsOneWithId.js';

const SubscriptionSchema = new mongoose.Schema({
  revenuecatId: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['FREE', 'STANDARD', 'PREMIUM'],
    required: true,
    default: 'FREE',
  },
});

export default new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    authId: { type: String, required: true, index: true, unique: true },
    currency: { type: String, required: true },
    language: { type: String, required: true },
    subscription: {
      type: SubscriptionSchema,
      default: {
        revenuecatId: '',
        type: 'FREE',
      },
    },
    notificationTokens: {
      type: [String],
      default: [],
    },
  },
  {
    statics: {
      existsOneWithId,
    },
  },
);
