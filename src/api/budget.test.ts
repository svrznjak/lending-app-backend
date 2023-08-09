import mongoose from 'mongoose';
import 'dotenv/config';
import transaction from './transaction.js';
import budget from './budget.js';
describe('Manual tests', () => {
  beforeAll(async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI);
    } catch (err) {
      throw new Error('Failed to connect to MongoDB');
    }
  });
  afterAll(async () => {
    mongoose.connection.close();
  });
  test('add', async () => {
    const response = await budget.create(
      '6319700ccac59dc8fdc9de05',
      {
        name: 'Test',
        description: 'Test',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'DAY',
          amount: 5,
          isCompounding: false,
          entryTimestamp: 2123145213123,
        },
        defaultPaymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 2123145213123,
        },
      },
      1000,
      'FIRST TRANSACTION',
    );
    console.log(response);
    expect(true).toBeTruthy();
  });
  test('edit', async () => {
    const response = await budget.edit({
      budgetId: '63198303a720d8c914af7b78',
      name: 'new new name',
      defaultInterestRateAmount: 20,
    });
    console.log(response);
    expect(true).toBeTruthy();
  });
  test('delete', async () => {
    const response = await transaction.delete('63245a9a918df28182c8b8e9');
    console.log(response);
    expect(true).toBeTruthy();
  });
});
