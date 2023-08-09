import mongoose from 'mongoose';

const LoanPaymentFrequency = new mongoose.Schema({
  occurrence: {
    type: String,
    enum: ['ONE_TIME', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
    required: true,
  },
  isStrict: { type: Boolean, required: true },
  strictValue: {
    type: String,
    enum: [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '30',
      '31',
    ],
    required: false,
  },
  entryTimestamp: { type: Number, default: Date.now() },
});

LoanPaymentFrequency.add({ revisions: LoanPaymentFrequency });
export const LoanPaymentFrequencySchema = LoanPaymentFrequency;
