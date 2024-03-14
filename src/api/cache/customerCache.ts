import { endOfHour, differenceInMilliseconds } from 'date-fns';
import { ICustomer } from '../types/customer/customerInterface.js';

interface ISimpleCache {
  [key: string]: any;
}

const CACHE: ISimpleCache = {};

export default {
  getCachedItem: function ({ userId }: { userId: string }): ICustomer[] | false {
    if (CACHE[userId] === undefined) return false;
    return CACHE[userId].entries;
  },
  getCachedItemEtag: function ({ userId }: { userId: string }): string | false {
    if (CACHE[userId] === undefined) return false;
    return CACHE[userId].etag;
  },
  setCachedItem: function ({ userId, value }: { userId: string; value: ICustomer[] }): void {
    const NOW = new Date().getTime();
    const MILLISECONDS_UNTIL_NEXT_HOUR = differenceInMilliseconds(endOfHour(NOW), NOW);
    CACHE[userId] = { etag: NOW.toString(), entries: value };

    // set timeout to clear calculated values at end of hour
    setTimeout(() => {
      CACHE[userId] = undefined;
    }, MILLISECONDS_UNTIL_NEXT_HOUR);
  },
  addCustomerToUsersCache: function ({ userId, customer }: { userId: string; customer: ICustomer }): void {
    let CUSTOMERS = CACHE[userId]?.entries;
    if (CUSTOMERS === undefined) CUSTOMERS = [];

    // if users cache already includes budget with same _id, replace it
    const customerIndex = CUSTOMERS.findIndex((b) => b._id === customer._id);
    if (customerIndex !== -1) {
      CUSTOMERS[customerIndex] = customer;
    } else {
      CUSTOMERS.push(customer);
    }
    this.setCachedItem({ userId, value: CUSTOMERS });
  },
};
