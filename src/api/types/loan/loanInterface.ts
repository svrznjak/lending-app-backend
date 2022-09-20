import { IInterestRate } from '../interestRate/interestRateInterface.js';
import { INote } from '../note/noteInterface.js';

export interface ILoan {
  _id: string;
  name: string;
  description: string;
  notes: [INote?];
  openedTimestamp: number;
  closesTimestamp: number;
  interestRate: IInterestRate;
  initialPrincipal: number;
  status: 'ACTIVE' | 'PAUSED' | 'PAID' | 'CLOSED' | 'DEFAULTED';
  calculatedTotalPaidPrincipal: number;
  calculatedChargedInterest: number;
  calculatedPaidInterest: number;
}
