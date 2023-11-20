import { IInterestRate } from '../interestRate/interestRateInterface.js';
import { IPaymentFrequency } from '../paymentFrequency/paymentFrequencyInterface.js';
import { ITransactionAddress } from '../transactionAddress/transactionAddressInterface.js';

export interface IBudget {
  _id: string;
  userId: string;
  name: string;
  description: string;
  defaultInterestRate: IInterestRate;
  defaultPaymentFrequency: IPaymentFrequency;
  isArchived: boolean;
  currentStats?: IBudgetStats;
  transactionList?: IBudgetTransaction[];
}

export interface IBudgetTransaction {
  _id: string;
  timestamp: number;
  description: string;
  from: ITransactionAddress;
  to: ITransactionAddress;
  amount: number;
  budgetStats: IBudgetStats;
}

export interface IBudgetStats {
  totalInvestedAmount: number;
  totalWithdrawnAmount: number;
  totalAvailableAmount: number;
  currentlyPaidBackPrincipalAmount: number;
  currentlyEarnedInterestAmount: number;
  currentlyEarnedFeesAmount: number;
  currentlyLendedPrincipalToLiveLoansAmount: number;
  totalLostPrincipalToCompletedAndDefaultedLoansAmount: number;
  totalGains: number;
  totalForgivenAmount: number;
  totalLentAmount: number;
  totalAssociatedLoans: number;
  totalAssociatedLiveLoans: number;
  avarageAssociatedLoanDuration: number | null;
  avarageAssociatedLoanAmount: number | null;
}
