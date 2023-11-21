import { ITransactionAddress } from './transactionAddressInterface.js';
import _ from 'lodash';
import { isValidOption } from '../../utils/inputValidator/inputValidator.js';

export const transactionAddressHelpers = {
  validate: {
    all: function validateAll(transactionAddress: ITransactionAddress): ITransactionAddress {
      this.datatype(transactionAddress.datatype);
      return transactionAddress;
    },
    datatype: function validateDatatype(datatype: string): string {
      if (
        !isValidOption({
          option: datatype,
          validOptions: ['BUDGET', 'LOAN', 'FEE', 'OUTSIDE', 'FORGIVENESS'],
          caseSensitive: true,
        })
      )
        throw new Error('(validation) datatype is invalid!');
      return datatype;
    },
  },
  runtimeCast: function runtimeCast(transactionAddress: any): ITransactionAddress {
    if (typeof this !== 'object' || this === null) throw new Error('Type of User must be an object!');
    if (!_.isString(transactionAddress.datatype))
      throw new Error('Type of transactionAddress.datatype must be a string!');
    if (!_.isString(transactionAddress.addressId))
      throw new Error('Type of transactionAddress.addressId must be a string!');

    return {
      datatype: transactionAddress.datatype,
      addressId: transactionAddress.addressId,
    };
  },
};
