import { IInterestRate } from '../interestRate/interestRateInterface.js';
import { IPaymentFrequency } from '../paymentFrequency/paymentFrequencyInterface.js';

export interface IBudget {
  _id: string;
  userId: string;
  name: string;
  description: string;
  defaultInterestRate: IInterestRate;
  defaultPaymentFrequency: IPaymentFrequency;
  calculatedTotalInvestedAmount: number;
  calculatedTotalWithdrawnAmount: number;
  calculatedTotalAvailableAmount: number;
  isArchived: boolean;
}
