import { GraphQLID } from 'graphql';
import { GraphQLObjectType, GraphQLNonNull, GraphQLString } from 'graphql';
import { getUserByAuthId } from '../../../api/user.js';

import { customerType } from './type.js';
import { ICustomer } from '../../../api/types/customer/customerInterface.js';
import Customer from '../../../api/customer.js';

export default new GraphQLObjectType({
  name: 'CustomerMutations',
  fields: (): any => ({
    create: {
      type: customerType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: GraphQLString },
        phone: { type: GraphQLString },
        address: { type: GraphQLString },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ICustomer> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        try {
          const newCustomerInfo: Pick<ICustomer, 'name' | 'email' | 'phone' | 'address'> = {
            name: args.name,
            email: args.email,
            phone: args.phone,
            address: args.address,
          };
          return await Customer.create(user._id.toString(), newCustomerInfo);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    edit: {
      type: customerType,
      args: {
        customerId: { type: new GraphQLNonNull(GraphQLID) },
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: GraphQLString },
        phone: { type: GraphQLString },
        address: { type: GraphQLString },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ICustomer> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        try {
          const newCustomerInfo: Pick<ICustomer, 'name' | 'email' | 'phone' | 'address'> = {
            name: args.name,
            email: args.email,
            phone: args.phone,
            address: args.address,
          };
          return await Customer.edit(user._id.toString(), args.customerId, newCustomerInfo);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    archive: {
      type: customerType,
      args: {
        customerId: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ICustomer> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        try {
          return await Customer.archive(user._id.toString(), args.customerId);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    unArchive: {
      type: customerType,
      args: {
        customerId: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ICustomer> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        try {
          return await Customer.unArchive(user._id.toString(), args.customerId);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    addNote: {
      type: customerType,
      args: {
        customerId: { type: new GraphQLNonNull(GraphQLID) },
        content: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ICustomer> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        try {
          return await Customer.addNote(user._id.toString(), args.customerId, args.content);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    editNote: {
      type: customerType,
      args: {
        customerId: { type: new GraphQLNonNull(GraphQLID) },
        noteId: { type: new GraphQLNonNull(GraphQLID) },
        content: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ICustomer> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        try {
          return await Customer.editNote(user._id.toString(), args.customerId, args.noteId, args.content);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
    deleteNote: {
      type: customerType,
      args: {
        customerId: { type: new GraphQLNonNull(GraphQLID) },
        noteId: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_parent: any, args: any, context: any): Promise<ICustomer> {
        const userAuthId = await context.getCurrentUserAuthIdOrThrowValidationError();
        const user = await getUserByAuthId(userAuthId);

        try {
          return await Customer.deleteNote(user._id.toString(), args.customerId, args.noteId);
        } catch (err: any) {
          console.log(err.message);
          throw new Error(err.message);
        }
      },
    },
  }),
});
