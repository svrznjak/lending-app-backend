import { GraphQLEnumType, GraphQLFloat, GraphQLID, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import Budgets from '../../../api/budget.js';
import Loans from '../../../api/loan.js';
import { IBudget } from '../../../api/types/budget/budgetInterface.js';
import { ILoan } from '../../../api/types/loan/loanInterface.js';
import { ITransaction } from '../../../api/types/transaction/transactionInterface.js';
import { budgetsType } from '../budget/type.js';
import { loansType } from '../loan/type.js';

export const transactionType = new GraphQLObjectType({
  name: 'TransactionType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    transactionTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    from: { type: new GraphQLNonNull(transactionAddressType) },
    to: { type: new GraphQLNonNull(transactionAddressType) },
    amount: { type: new GraphQLNonNull(GraphQLFloat) },
    entryTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    affectedBudget: {
      type: budgetsType,
      resolve: async (parent: ITransaction): Promise<IBudget | undefined> => {
        if (parent.from.datatype === 'BUDGET')
          return await Budgets.getOneFromUser({ userId: parent.userId, budgetId: parent.from.addressId });
        else if (parent.to.datatype === 'BUDGET')
          return await Budgets.getOneFromUser({ userId: parent.userId, budgetId: parent.to.addressId });
        return undefined;
      },
    },
    affectedLoan: {
      type: loansType,
      resolve: async (parent: ITransaction): Promise<ILoan | undefined> => {
        if (parent.from.datatype === 'LOAN')
          return await Loans.getOneFromUser({ userId: parent._id, loanId: parent.from.addressId });
        else if (parent.to.datatype === 'LOAN')
          return await Loans.getOneFromUser({ userId: parent._id, loanId: parent.to.addressId });
        return undefined;
      },
    },
  }),
});

const transactionAddressType = new GraphQLObjectType({
  name: 'TransactionAddressType',
  fields: (): any => ({
    datatype: {
      type: new GraphQLNonNull(
        new GraphQLEnumType({
          name: 'addressIdType',
          values: {
            BUDGET: { value: 'BUDGET' },
            LOAN: { value: 'LOAN' },
            INTEREST: { value: 'INTEREST' },
            OUTSIDE: { value: 'OUTSIDE' },
          },
        }),
      ),
    },
    addressId: { type: new GraphQLNonNull(GraphQLID) },
  }),
});
