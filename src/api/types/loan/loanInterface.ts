import { IInterestRate } from '../interestRate/interestRateInterface.js';
import { INote } from '../note/noteInterface.js';
import { ITransactionAddress } from '../transactionAddress/transactionAddressInterface.js';

export interface ILoan {
  _id: string;
  userId: string;
  name: string;
  description: string;
  customerId: string | undefined;
  notes: INote[];
  openedTimestamp: number;
  closesTimestamp: number;
  interestRate: IInterestRate;
  paymentFrequency: IPaymentFrequency;
  expectedPayments: IExpectedPayment[];
  status: 'ACTIVE' | 'PAUSED' | 'PAID' | 'COMPLETED' | 'DEFAULTED';
  calculatedInvestedAmount: number;
  calculatedTotalPaidPrincipal: number;
  calculatedOutstandingInterest: number;
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

export interface IPaymentFrequency {
  occurrence: 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  isStrict: boolean;
  strictValue?:
    | '1'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9'
    | '10'
    | '11'
    | '12'
    | '13'
    | '14'
    | '15'
    | '16'
    | '17'
    | '18'
    | '19'
    | '20'
    | '21'
    | '22'
    | '23'
    | '24'
    | '25'
    | '26'
    | '27'
    | '28'
    | '29'
    | '30'
    | '31';
}

export interface IExpectedPayment {
  timestamp: number;
  principalPayment: number;
  interestPayment: number;
  notified?: boolean;
}

export interface IRelatedBudget {
  budgetId: string;
  invested: number;
  withdrawn: number;
}
