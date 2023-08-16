export interface ITransactionAddress {
  datatype: 'BUDGET' | 'LOAN' | 'INTEREST' | 'OUTSIDE' | 'FORGIVENESS';
  addressId: string;
}
