import { GraphQLObjectType, GraphQLNonNull, GraphQLInt } from 'graphql';

export const paginationType = new GraphQLObjectType({
  name: 'PaginationType',
  fields: (): any => ({
    pageSize: { type: GraphQLInt },
    pageNumber: { type: GraphQLInt },
  }),
});
