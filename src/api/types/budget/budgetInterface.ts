import { IInterestRate } from '../interestRate/interestRateInterface.js';

export interface IBudget {
  _id: string;
  userId: string;
  name: string;
  description: string;
  defaultInterestRate: IInterestRate;
  calculatedTotalInvestedAmount: number;
  calculatedTotalWithdrawnAmount: number;
  calculatedTotalAvailableAmount: number;
  isArchived: boolean;
}
