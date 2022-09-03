export interface Transaction {
  _id: object;
  userId: string;
  transactionTimestamp: number;
  description: string;
  from: TransactionAddress;
  to: TransactionAddress;
  amount: number;
  entryTimestamp: number;
  revisions: Transaction;
}
export interface TransactionAddress {
  datatype: 'BUDGET' | 'LOAN' | 'INTEREST' | 'OUTSIDE';
  _id: object;
}
