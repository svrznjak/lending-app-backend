import { IInterestRate } from '../interestRate/interestRateInterface.js';
import { INote } from '../note/noteInterface.js';
import { ITransactionAddress } from '../transactionAddress/transactionAddressInterface.js';

export interface ILoan {
  _id: string;
  userId: string;
  name: string;
  description: string;
  notes: INote[];
  openedTimestamp: number;
  closesTimestamp: number;
  interestRate: IInterestRate;
  status: 'ACTIVE' | 'PAUSED' | 'PAID' | 'CLOSED' | 'DEFAULTED';
  calculatedInvestedAmount: number;
  calculatedTotalPaidPrincipal: number;
  calculatedChargedInterest: number;
  calculatedPaidInterest: number;
  calculatedLastTransactionTimestamp: number;
  calculatedRelatedBudgets: IRelatedBudget[];
  transactionList: ITransactionInterval[];
}

export interface ITransactionInterval {
  id: string;
  timestamp: number;
  description: string;
  totalInvested: number;
  totalPaidPrincipal: number;
  totalPaidInterest: number;
  from: ITransactionAddress;
  to: ITransactionAddress;
  invested: number;
  feeCharged: number;
  interestCharged: number;
  principalPaid: number;
  interestPaid: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
}

export interface IRelatedBudget {
  budgetId: string;
  invested: number;
  withdrawn: number;
}
