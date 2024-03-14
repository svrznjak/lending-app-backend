import _ from 'lodash';
import { isValidEmail, isValidText, isValidTimestamp } from '../../utils/inputValidator/inputValidator.js';
import { ICustomer } from './customerInterface.js';
import { sanitizeText, sanitizeEmail } from '../../utils/inputSanitizer/inputSanitizer.js';
import { noteHelpers } from '../note/noteHelpers.js';
import { INote } from '../note/noteInterface.js';

export const customerHelpers = {
  validate: {
    all: function validateAll(customer: ICustomer): ICustomer {
      this.name(customer.name);
      this.email(customer.email);
      this.phone(customer.phone);
      this.address(customer.address);
      this.entryTimestamp(customer.entryTimestamp);
      this.notes(customer.notes);

      return customer;
    },
    name: function validateName(name: string): string {
      if (!isValidText({ text: name, validEmpty: false, minLength: 1, maxLength: 500 }))
        throw new Error('(validation) name is invalid!');
      return name;
    },
    email: function validateEmail(email: string): string {
      if (!isValidEmail({ email }) && email.length > 0) throw new Error('(validation) email is invalid!');
      return email;
    },
    phone: function validatePhone(phone: string): string {
      if (!isValidText({ text: phone, validEmpty: true, minLength: 1, maxLength: 15 }))
        throw new Error('(validation) phone is invalid!');
      return phone;
    },
    address: function validateAddress(address: string): string {
      if (!isValidText({ text: address, validEmpty: true, minLength: 1, maxLength: 1500 }))
        throw new Error('(validation) address is invalid!');
      return address;
    },
    notes: function validateNotes(notes: INote[]): INote[] {
      for (const note of notes) {
        noteHelpers.validate.all(note);
      }
      return notes;
    },
    entryTimestamp: function validateEntryTimestamp(entryTimestamp: number): number {
      if (!isValidTimestamp({ timestamp: entryTimestamp }) && entryTimestamp !== undefined)
        throw new Error('(validation) entryTimestamp is invalid!');
      return entryTimestamp;
    },
  },
  sanitize: {
    all: function sanitizeAll(customer: Partial<ICustomer>): void {
      customer.name = this.name(customer.name);
      customer.email = this.email(customer.email);
      customer.phone = this.phone(customer.phone);
      customer.address = this.address(customer.address);
      customer.notes = this.notes(customer.notes);
    },
    name: function sanitizeName(name: string): string {
      return sanitizeText({ text: name });
    },
    email: function sanitizeCustomerEmail(email: string): string {
      return sanitizeEmail({ email });
    },
    phone: function sanitizePhone(phone: string): string {
      return sanitizeText({ text: phone });
    },
    address: function sanitizeAddress(address: string): string {
      return sanitizeText({ text: address });
    },
    notes: function sanitizeNotes(notes: INote[]): INote[] {
      for (const note of notes) {
        noteHelpers.sanitize.all(note);
      }
      return notes;
    },
  },

  runtimeCast: function runtimeCast(customer: any): ICustomer {
    if (typeof customer !== 'object' || customer === null) throw new Error('Type of Customer must be an object!');
    if (!_.isString(customer._id)) throw new Error('Type of customer._id must be a string!');
    if (!_.isString(customer.userId)) throw new Error('Type of customer.userId must be a string!');
    if (!_.isString(customer.name)) throw new Error('Type of customer.name must be a string!');
    if (!_.isString(customer.email)) throw new Error('Type of customer.email must be a string!');
    if (!_.isString(customer.phone)) throw new Error('Type of customer.phone must be a string!');
    if (!_.isString(customer.address)) throw new Error('Type of customer.address must be a string!');
    if (!_.isArray(customer.notes)) throw new Error('Type of customer.notes must be an array!');
    if (!_.isBoolean(customer.isArchived)) throw new Error('Type of customer.isArchived must be a boolean!');
    if (!_.isNumber(customer.entryTimestamp)) throw new Error('Type of customer.entryTimestamp must be a number!');

    // runtimecast notes
    for (const note of customer.notes) {
      noteHelpers.runtimeCast(note);
    }

    return {
      _id: customer._id,
      userId: customer.userId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
      isArchived: customer.isArchived,
      entryTimestamp: customer.entryTimestamp,
    };
  },
};
