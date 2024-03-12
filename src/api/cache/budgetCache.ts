import { endOfHour, differenceInMilliseconds } from 'date-fns';
import { IBudget } from '../types/budget/budgetInterface.js';

interface ISimpleCache {
  [key: string]: any;
}

const CACHE: ISimpleCache = {};

export default {
  getCachedItem: function ({ userId }: { userId: string }): IBudget[] | false {
    if (CACHE[userId] === undefined) return false;
    return CACHE[userId].entries;
  },
  getCachedItemEtag: function ({ userId }: { userId: string }): string | false {
    if (CACHE[userId] === undefined) return false;
    return CACHE[userId].etag;
  },
  setCachedItem: function ({ userId, value }: { userId: string; value: IBudget[] }): void {
    const NOW = new Date().getTime();
    const MILLISECONDS_UNTIL_NEXT_HOUR = differenceInMilliseconds(endOfHour(NOW), NOW);
    CACHE[userId] = { etag: NOW.toString(), entries: value };

    // set timeout to clear calculated values at end of hour
    setTimeout(() => {
      CACHE[userId] = undefined;
    }, MILLISECONDS_UNTIL_NEXT_HOUR);
  },
  addBudgetToUsersCache: function ({ userId, budget }: { userId: string; budget: IBudget }): void {
    let BUDGETS = CACHE[userId]?.entries;
    if (BUDGETS === undefined) BUDGETS = [];

    // if users cache already includes budget with same _id, replace it
    const budgetIndex = BUDGETS.findIndex((b) => b._id === budget._id);
    if (budgetIndex !== -1) {
      BUDGETS[budgetIndex] = budget;
    } else {
      BUDGETS.push(budget);
    }
    this.setCachedItem({ userId, value: BUDGETS });
  },
};
