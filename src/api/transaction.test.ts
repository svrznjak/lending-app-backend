import mongoose from 'mongoose';
import 'dotenv/config';
import transaction from './transaction.js';
describe('Manual tests', () => {
  beforeAll(async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI);
    } catch (err) {
      throw new Error('Failed to connect to MongoDB');
    }
  });
  test('add', async () => {
    const response = await transaction.add({
      userId: '6319700ccac59dc8fdc9de05',
      transactionTimestamp: 1663249282,
      description: 'new transaction',
      from: {
        datatype: 'OUTSIDE',
        addressId: '6319700ccac59dc8fdc9de04',
      },
      to: {
        datatype: 'BUDGET',
        addressId: '6319700ccac59dc8fdc9de05',
      },
      amount: 2000,
      entryTimestamp: 1663249282,
    });
    console.log(response);
    expect(true).toBeTruthy();
  });
  test('edit', async () => {
    const response = await transaction.edit('6324ae64a03d6a8800cc8f52', {
      transactionTimestamp: 1663244582,
      description: 'Edited transaction',
      amount: 3500,
      entryTimestamp: 1663249282,
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
