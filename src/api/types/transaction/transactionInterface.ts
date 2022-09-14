import { ITransactionAddress } from '../transactionAddress/transactionAddressInterface.js';

export interface ITransaction {
  _id: object;
  userId: string;
  transactionTimestamp: number;
  description: string;
  from: ITransactionAddress;
  to: ITransactionAddress;
  amount: number;
  entryTimestamp: number;
  revisions: [ITransaction?];
}
