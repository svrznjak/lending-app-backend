import { GraphQLInputObjectType, GraphQLInt } from 'graphql';

export const paginationInputType = new GraphQLInputObjectType({
  name: 'PaginationInputType',
  fields: (): any => ({
    pageSize: { type: GraphQLInt },
    pageNumber: { type: GraphQLInt },
  }),
});
