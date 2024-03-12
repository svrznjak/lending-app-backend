import { ILoan } from './../types/loan/loanInterface.js';
import { endOfHour, differenceInMilliseconds } from 'date-fns';

interface ISimpleCache {
  [key: string]: any;
}

const CACHE: ISimpleCache = {};

export default {
  getCachedItem: function ({ itemId }: { itemId: string }): ILoan | false {
    if (CACHE[itemId] === undefined) return false;
    return CACHE[itemId].entries;
  },
  getCachedItemEtag: function ({ userId }: { userId: string }): string | false {
    if (CACHE[userId] === undefined) return false;
    return CACHE[userId].etag;
  },
  setCachedItem: function ({ itemId, value }: { itemId: string; value: ILoan }): void {
    const NOW = new Date().getTime();
    const MILLISECONDS_UNTIL_NEXT_HOUR = differenceInMilliseconds(endOfHour(NOW), NOW);

    CACHE[itemId] = { etag: NOW.toString(), entries: value };

    // set timeout to clear calculated values at end of hour
    setTimeout(() => {
      CACHE[itemId] = undefined;
    }, MILLISECONDS_UNTIL_NEXT_HOUR);
  },
  refreshEtag: function ({ itemId }: { itemId: string }): void {
    const NOW = new Date().getTime();
    CACHE[itemId].etag = NOW;
  },
};
