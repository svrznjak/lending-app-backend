import { ILoan } from './../types/loan/loanInterface.js';
import { endOfHour, differenceInMilliseconds } from 'date-fns';

interface ISimpleCache {
  [key: string]: any;
}

const CACHE: ISimpleCache = {};

export default {
  getCachedItem: function ({ userId }: { userId: string }): ILoan[] | undefined {
    if (CACHE[userId] === undefined) return undefined;
    return CACHE[userId].entries;
  },
  getCachedItemEtag: function ({ userId }: { userId: string }): string | undefined {
    if (CACHE[userId] === undefined) return undefined;
    return CACHE[userId].etag;
  },
  setCachedItem: function ({ userId, value }: { userId: string; value: ILoan[] }): void {
    const NOW = new Date().getTime();
    const MILLISECONDS_UNTIL_NEXT_HOUR = differenceInMilliseconds(endOfHour(NOW), NOW);
    CACHE[userId] = { etag: NOW.toString(), entries: value };

    // set timeout to clear calculated values at end of hour
    setTimeout(() => {
      CACHE[userId] = undefined;
    }, MILLISECONDS_UNTIL_NEXT_HOUR);
  },
  addLoanToUsersCache: function ({ userId, loan }: { userId: string; loan: ILoan }): void {
    let LOANS = CACHE[userId]?.entries;
    if (LOANS === undefined) LOANS = [];

    // if users cache already includes budget with same _id, replace it
    const loanIndex = LOANS.findIndex((b) => b._id === loan._id);
    if (loanIndex !== -1) {
      LOANS[loanIndex] = loan;
    } else {
      LOANS.push(loan);
    }
    this.setCachedItem({ userId, value: LOANS });
  },
  refreshEtag: function ({ itemId }: { itemId: string }): void {
    const NOW = new Date().getTime();
    CACHE[itemId].etag = NOW;
  },
};
