import { IInterestRate } from '../interestRate/interestRateInterface.js';
import { INote } from '../note/noteInterface.js';

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
}

export interface IRelatedBudget {
  budgetId: string;
  invested: number;
  withdrawn: number;
}
