import mongoose, { ClientSession } from 'mongoose';
import { customerHelpers } from './types/customer/customerHelpers.js';
import { ICustomer } from './types/customer/customerInterface.js';
import * as User from './user.js';
import CustomerModel from './db/model/CustomerModel.js';
import customerCache from './cache/customerCache.js';

export default {
  create: async function createCustomer(
    userId,
    input: Pick<ICustomer, 'name' | 'email' | 'phone' | 'address'>,
  ): Promise<ICustomer> {
    // check if user exists
    await User.checkIfExists(userId);

    const newCustomerData: ICustomer = customerHelpers.runtimeCast({
      _id: new mongoose.Types.ObjectId().toString(),
      userId: userId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      notes: [],
      isArchived: false,
      entryTimestamp: Date.now(),
    });

    // validate and sanitize input
    customerHelpers.validate.all(newCustomerData);
    customerHelpers.sanitize.all(newCustomerData);

    try {
      const newCustomer = await new CustomerModel(newCustomerData).save();
      customerCache.addCustomerToUsersCache({ userId, customer: newCustomer });

      return customerHelpers.runtimeCast({
        ...newCustomer.toObject(),
        _id: newCustomer._id.toString(),
        userId: newCustomer.userId.toString(),
        notes: newCustomer.notes.map((note: any) => ({
          ...note.toObject(),
          _id: note._id.toString(),
        })),
      });
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  },
  edit: async function editCustomer(
    userId: string,
    customerId: string,
    input: Pick<ICustomer, 'name' | 'email' | 'phone' | 'address'>,
  ): Promise<ICustomer> {
    const MONGO_CUSTOMER = await CustomerModel.findOne({ _id: customerId, userId: userId });
    if (MONGO_CUSTOMER === null) throw new Error('Customer does not exist!');

    if (input.name !== undefined) {
      // validate and sanitize input
      customerHelpers.validate.name(input.name);
      customerHelpers.sanitize.name(input.name);

      MONGO_CUSTOMER.name = input.name;
    }
    if (input.email !== undefined) {
      // validate and sanitize input
      customerHelpers.validate.email(input.email);
      customerHelpers.sanitize.email(input.email);

      MONGO_CUSTOMER.email = input.email;
    }
    if (input.phone !== undefined) {
      // validate and sanitize input
      customerHelpers.validate.phone(input.phone);
      customerHelpers.sanitize.phone(input.phone);

      MONGO_CUSTOMER.phone = input.phone;
    }
    if (input.address !== undefined) {
      // validate and sanitize input
      customerHelpers.validate.address(input.address);
      customerHelpers.sanitize.address(input.address);

      MONGO_CUSTOMER.address = input.address;
    }

    MONGO_CUSTOMER.entryTimestamp = Date.now();

    const changedCustomer = customerHelpers.runtimeCast({
      ...MONGO_CUSTOMER.toObject(),
      _id: MONGO_CUSTOMER._id.toString(),
      userId: MONGO_CUSTOMER.userId.toString(),
      notes: MONGO_CUSTOMER.notes.map((note: any) => ({
        ...note.toObject(),
        _id: note._id.toString(),
      })),
    });

    await MONGO_CUSTOMER.save();

    customerCache.addCustomerToUsersCache({ userId, customer: changedCustomer });

    return changedCustomer;
  },
  archive: async function archiveCustomer(userId: string, customerId: string): Promise<ICustomer> {
    const MONGO_CUSTOMER = await CustomerModel.findOne({ _id: customerId, userId: userId });
    if (MONGO_CUSTOMER === null) throw new Error('Customer does not exist!');

    MONGO_CUSTOMER.isArchived = true;
    MONGO_CUSTOMER.entryTimestamp = Date.now();

    const changedCustomer = customerHelpers.runtimeCast({
      ...MONGO_CUSTOMER.toObject(),
      _id: MONGO_CUSTOMER._id.toString(),
      userId: MONGO_CUSTOMER.userId.toString(),
      notes: MONGO_CUSTOMER.notes.map((note: any) => ({
        ...note.toObject(),
        _id: note._id.toString(),
      })),
    });

    await MONGO_CUSTOMER.save();

    customerCache.addCustomerToUsersCache({ userId, customer: changedCustomer });

    return changedCustomer;
  },
  unArchive: async function unArchiveCustomer(userId: string, customerId: string): Promise<ICustomer> {
    const MONGO_CUSTOMER = await CustomerModel.findOne({ _id: customerId, userId: userId });
    if (MONGO_CUSTOMER === null) throw new Error('Customer does not exist!');

    MONGO_CUSTOMER.isArchived = false;
    MONGO_CUSTOMER.entryTimestamp = Date.now();

    const changedCustomer = customerHelpers.runtimeCast({
      ...MONGO_CUSTOMER.toObject(),
      _id: MONGO_CUSTOMER._id.toString(),
      userId: MONGO_CUSTOMER.userId.toString(),
      notes: MONGO_CUSTOMER.notes.map((note: any) => ({
        ...note.toObject(),
        _id: note._id.toString(),
      })),
    });

    await MONGO_CUSTOMER.save();

    customerCache.addCustomerToUsersCache({ userId, customer: changedCustomer });

    return changedCustomer;
  },
  checkIfExists: async function checkIfCustomerExists(customerId: string, session?: ClientSession): Promise<void> {
    if (!(await CustomerModel.existsOneWithId(customerId, session)))
      throw new Error('Customer with prodived _id does not exist!');
  },
  getOneFromUser: async function getOneCustomerFromUser({
    userId,
    customerId,
  }: {
    userId: string;
    customerId: string;
  }): Promise<ICustomer> {
    if (typeof userId !== 'string') throw new TypeError('userId is not a string');
    if (typeof customerId !== 'string') throw new TypeError('customerId is not a string');

    const ALL_CUSTOMERS = await this.getAllFromUser({ userId });
    const CUSTOMER = ALL_CUSTOMERS.find((customer) => customer._id === customerId);
    if (CUSTOMER === undefined) throw new Error('Customer does not exist!');
    return CUSTOMER;
  },
  getAllFromUser: async function getAllCustomersFromUser({ userId }: { userId: string }): Promise<ICustomer[]> {
    if (typeof userId !== 'string') throw new TypeError('userId is not a string');
    const CACHED_CUSTOMERS = customerCache.getCachedItem({ userId });
    if (CACHED_CUSTOMERS !== false) {
      if (CACHED_CUSTOMERS.length === (await CustomerModel.countDocuments({ userId: userId }))) return CACHED_CUSTOMERS;
    }

    const MONGO_CUSTOMERS = await CustomerModel.find({ userId: userId });
    if (MONGO_CUSTOMERS === null) throw new Error('User does not exist!');

    const CUSTOMERS = MONGO_CUSTOMERS.map((customer) =>
      customerHelpers.runtimeCast({
        ...customer.toObject(),
        _id: customer._id.toString(),
        userId: customer.userId.toString(),
        notes: customer.notes.map((note: any) => ({
          ...note.toObject(),
          _id: note._id.toString(),
        })),
      }),
    );

    customerCache.setCachedItem({ userId, value: CUSTOMERS });

    return CUSTOMERS;
  },
  addNote: async function addNoteToCustomer(
    userId: string,
    customerId: string,
    note: string,
  ): Promise<ICustomer | undefined> {
    const MONGO_CUSTOMER = await CustomerModel.findOne({ _id: customerId, userId: userId });
    if (MONGO_CUSTOMER === null) throw new Error('Customer does not exist!');

    MONGO_CUSTOMER.notes.push({
      _id: new mongoose.Types.ObjectId().toString(),
      content: note,
      entryTimestamp: Date.now(),
    });
    MONGO_CUSTOMER.markModified('notes');

    const changedCustomer = customerHelpers.runtimeCast({
      ...MONGO_CUSTOMER.toObject(),
      _id: MONGO_CUSTOMER._id.toString(),
      userId: MONGO_CUSTOMER.userId.toString(),
      notes: MONGO_CUSTOMER.notes.map((note: any) => ({
        ...note.toObject(),
        _id: note._id.toString(),
      })),
    });

    await MONGO_CUSTOMER.save();

    customerCache.addCustomerToUsersCache({ userId, customer: changedCustomer });

    return changedCustomer;
  },
  editNote: async function editNoteFromCustomer(
    userId: string,
    customerId: string,
    noteId: string,
    content: string,
  ): Promise<ICustomer> {
    const MONGO_CUSTOMER = await CustomerModel.findOne({ _id: customerId, userId: userId });
    if (MONGO_CUSTOMER === null) throw new Error('Customer does not exist!');
    const NOTE_INDEX = MONGO_CUSTOMER.notes.findIndex((note) => note._id.toString() === noteId);
    if (NOTE_INDEX === -1) throw new Error('Note does not exist!');
    MONGO_CUSTOMER.notes[NOTE_INDEX].content = content;
    MONGO_CUSTOMER.notes[NOTE_INDEX].entryTimestamp = Date.now();
    MONGO_CUSTOMER.markModified('notes');

    const changedCustomer = customerHelpers.runtimeCast({
      ...MONGO_CUSTOMER.toObject(),
      _id: MONGO_CUSTOMER._id.toString(),
      userId: MONGO_CUSTOMER.userId.toString(),
      notes: MONGO_CUSTOMER.notes.map((note: any) => ({
        ...note.toObject(),
        _id: note._id.toString(),
      })),
    });

    await MONGO_CUSTOMER.save();

    customerCache.addCustomerToUsersCache({ userId, customer: changedCustomer });

    return changedCustomer;
  },
  deleteNote: async function deleteNoteFromCustomer(
    userId: string,
    customerId: string,
    noteId: string,
  ): Promise<ICustomer> {
    const MONGO_CUSTOMER = await CustomerModel.findOne({ _id: customerId, userId: userId });
    if (MONGO_CUSTOMER === null) throw new Error('Customer does not exist!');
    const NOTE_INDEX = MONGO_CUSTOMER.notes.findIndex((note) => note._id.toString() === noteId);
    if (NOTE_INDEX === -1) throw new Error('Note does not exist!');
    MONGO_CUSTOMER.notes.splice(NOTE_INDEX, 1);
    MONGO_CUSTOMER.markModified('notes');

    const changedCustomer = customerHelpers.runtimeCast({
      ...MONGO_CUSTOMER.toObject(),
      _id: MONGO_CUSTOMER._id.toString(),
      userId: MONGO_CUSTOMER.userId.toString(),
      notes: MONGO_CUSTOMER.notes.map((note: any) => ({
        ...note.toObject(),
        _id: note._id.toString(),
      })),
    });

    await MONGO_CUSTOMER.save();

    customerCache.addCustomerToUsersCache({ userId, customer: changedCustomer });

    return changedCustomer;
  },
};
