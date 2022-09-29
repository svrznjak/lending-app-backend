import { GraphQLFloat, GraphQLList } from 'graphql';
import { GraphQLObjectType, GraphQLNonNull, GraphQLString, GraphQLInt, GraphQLID } from 'graphql';
import { ILoan } from '../../../api/types/loan/loanInterface.js';
import { getUserByAuthId } from '../../../api/user.js';
import { interestRateInputType } from '../interestRate/type.js';

import Loan from '../../../api/loan.js';
import { loansType, fundType } from './type.js';
export default new GraphQLObjectType({
  name: 'LoanMutations',
  fields: (): any => ({
    createLoan: {
      type: loansType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        openedTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        closesTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
        interestRate: { type: new GraphQLNonNull(interestRateInputType) },
        initialTransactionDescription: { type: new GraphQLNonNull(GraphQLString) },
        funds: { type: new GraphQLList(fundType) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ILoan> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        try {
          const newLoanInfo: Pick<
            ILoan,
            'name' | 'description' | 'openedTimestamp' | 'closesTimestamp' | 'initialPrincipal' | 'interestRate'
          > = {
            name: args.name,
            description: args.description,
            openedTimestamp: args.openedTimestamp,
            closesTimestamp: args.closesTimestamp,
            initialPrincipal: args.funds.reduce((total, fund) => total + fund.amount),
            interestRate: args.interestRate,
          };
          const newLoan = await Loan.create(
            user._id.toString(),
            newLoanInfo,
            args.funds,
            args.initialTransactionDescription,
          );
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err);
        }
      },
    },
  }),
});
