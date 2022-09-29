import { GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString, GraphQLFloat } from 'graphql';

export const noteType = new GraphQLObjectType({
  name: 'NoteType',
  fields: (): any => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    entryTimestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    revisions: { type: noteType },
  }),
});
