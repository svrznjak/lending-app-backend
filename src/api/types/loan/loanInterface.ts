import { IPaymentFrequency } from '../paymentFrequency/paymentFrequencyInterface.js';
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
  paymentFrequency: IPaymentFrequency;
  expectedPayments: IExpectedPayment[];
  status: ILoanStatus;
  calculatedInvestedAmount: number;
  calculatedOutstandingPrincipal: number;
  calculatedTotalPaidPrincipal: number;
  calculatedOutstandingInterest: number;
  calculatedOutstandingFees: number;
  calculatedPaidInterest: number;
  calculatedPaidFees: number;
  calculatedTotalForgiven: number;
  calculatedTotalRefunded: number;
  calculatedLastTransactionTimestamp: number;
  calculatedRelatedBudgets: IRelatedBudget[];
  transactionList: ITransactionInterval[];
}

export interface ILoanStatus {
  current: 'ACTIVE' | 'PAUSED' | 'PAID' | 'COMPLETED' | 'DEFAULTED';
  timestamp: number;
  previous?: ILoanStatus;
}

export interface ITransactionInterval {
  _id: string;
  timestamp: number;
  description: string;
  totalInvested: number;
  totalPaidPrincipal: number;
  totalPaidInterest: number;
  totalPaidFees: number;
  totalRefunded: number;
  totalForgiven: number;
  from: ITransactionAddress;
  to: ITransactionAddress;
  invested: number;
  interestCharged: number;
  feeCharged: number;
  principalPaid: IPaymentDetails[];
  interestPaid: IPaymentDetails[];
  feePaid: IPaymentDetails[];
  refundedAmount: IPaymentDetails[];
  forgivenAmount: IPaymentDetails[];
  outstandingPrincipal: number;
  outstandingInterest: number;
  outstandingFees: number;
}

interface IPaymentDetails {
  budgetId: string;
  amount: number;
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
