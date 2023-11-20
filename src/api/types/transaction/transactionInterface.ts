import { IInterestRate } from '../interestRate/interestRateInterface.js';
import { ITransactionAddress } from '../transactionAddress/transactionAddressInterface.js';

export interface ITransaction {
  _id: string;
  userId: string;
  transactionTimestamp: number;
  description: string;
  from: ITransactionAddress;
  to: ITransactionAddress;
  refund?: boolean;
  interestRate?: IInterestRate;
  relatedBudgetId?: string;
  amount: number;
  entryTimestamp: number;
  revisions?: ITransaction;
}
