import { ILoan } from './../types/loan/loanInterface.js';
import { endOfHour, differenceInMilliseconds } from 'date-fns';

interface ISimpleCache {
  [key: string]: any;
}

const CACHE: ISimpleCache = {};

export default {
  getCachedItem: function ({ itemId }: { itemId: string }): ILoan | false {
    if (CACHE[itemId] === undefined) return false;
    return CACHE[itemId];
  },
  setCachedItem: function ({ itemId, value }: { itemId: string; value: ILoan }): void {
    CACHE[itemId] = value;
    const NOW = new Date().getTime();
    const MILLISECONDS_UNTIL_NEXT_HOUR = differenceInMilliseconds(endOfHour(NOW), NOW);

    // set timeout to clear calculated values at end of hour
    setTimeout(() => {
      CACHE[itemId] = undefined;
    }, MILLISECONDS_UNTIL_NEXT_HOUR);
  },
};
