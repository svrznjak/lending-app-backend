import { ITransactionAddress } from './transactionAddressInterface.js';
import _ from 'lodash';
import { isValidOption } from '../../utils/inputValidator/inputValidator.js';

export const transactionAddressHelpers = {
  validate: function validate(transactionAddress: ITransactionAddress): ITransactionAddress {
    if (
      !isValidOption({
        option: transactionAddress.datatype,
        validOptions: ['BUDGET', 'LOAN', 'INTEREST', 'OUTSIDE'],
        caseSensitive: true,
      })
    )
      throw new Error('(validation) transactionAddress.datatype is invalid!');
    return transactionAddress;
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
