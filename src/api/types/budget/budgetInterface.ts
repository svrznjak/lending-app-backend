import { IInterestRate } from '../interestRate/interestRateInterface.js';

export interface IBudget {
  _id: string;
  userId: string;
  name: string;
  description: string;
  defaultInterestRate: IInterestRate;
  calculatedTotalAmount: number;
  calculatedLendedAmount: number;
  isArchived: boolean;
}
