import { FastifyInstance } from 'fastify';
import auth from '../api/auth.js';
import { getUserByAuthId } from '../api/user.js';
import { IUser } from '../api/types/user/userInterface.js';

import budget from '../api/budget.js';
import budgetCache from '../api/cache/budgetCache.js';

export default function configureHttpRoutes(fastify: FastifyInstance): void {
  fastify.get('/api/budgets', async (req, reply) => {
    const user = await getUserFromAuthHeader(req.headers.authorization);
    if (req.headers['if-none-match'] == budgetCache.getCachedItemEtag({ userId: user._id }))
      return reply.status(304).send();

    const fullBudgets = await budget.getAllFromUser({ userId: user._id });
    reply.header('ETag', budgetCache.getCachedItemEtag({ userId: user._id }));
    return fullBudgets.map((budget) => {
      return {
        _id: budget._id,
        name: budget.name,
        description: budget.description,
        defaultInterestRate: {
          type: budget.defaultInterestRate.type,
          duration: budget.defaultInterestRate.duration,
          amount: budget.defaultInterestRate.amount,
          isCompounding: budget.defaultInterestRate.isCompounding,
          entryTimestamp: budget.defaultInterestRate.entryTimestamp,
        },
        defaultPaymentFrequency: {
          occurrence: budget.defaultPaymentFrequency.occurrence,
          isStrict: budget.defaultPaymentFrequency.isStrict,
          strictValue: budget.defaultPaymentFrequency.strictValue,
        },
        isArchived: budget.isArchived,
        currentStats: budget.currentStats,
      };
    });
  });
  fastify.get('/api/budget', async (req, reply) => {
    const user = await getUserFromAuthHeader(req.headers.authorization);
    if (req.headers['if-none-match'] == budgetCache.getCachedItemEtag({ userId: user._id }))
      return reply.status(304).send();
    const queryParams = req.query as any;
    const budgetItem = await budget.getOneFromUser({ userId: user._id, budgetId: queryParams.id });

    reply.header('ETag', budgetCache.getCachedItemEtag({ userId: user._id }));

    return {
      _id: budgetItem._id,
      name: budgetItem.name,
      description: budgetItem.description,
      defaultInterestRate: {
        type: budgetItem.defaultInterestRate.type,
        duration: budgetItem.defaultInterestRate.duration,
        amount: budgetItem.defaultInterestRate.amount,
        isCompounding: budgetItem.defaultInterestRate.isCompounding,
        entryTimestamp: budgetItem.defaultInterestRate.entryTimestamp,
      },
      defaultPaymentFrequency: {
        occurrence: budgetItem.defaultPaymentFrequency.occurrence,
        isStrict: budgetItem.defaultPaymentFrequency.isStrict,
        strictValue: budgetItem.defaultPaymentFrequency.strictValue,
      },
      isArchived: budgetItem.isArchived,
      currentStats: budgetItem.currentStats,
    };
  });
}

async function getUserFromAuthHeader(authHeader: string | undefined): Promise<IUser> {
  if (!authHeader)
    throw new Error('You must be logged in to access this endpoint! Please provide correct HTTP Authorization header.');
  const cachedUser = getAuthHeaderCachedUser({ authHeader });
  if (cachedUser) return cachedUser;
  try {
    const authId = await auth.getAuthIdFromAuthHeader(authHeader || '');
    const user = await getUserByAuthId(authId);
    setAuthHeaderCachedUser({ authHeader, user });
    return user;
  } catch (err) {
    throw new Error('You must be logged in to access this endpoint! Please provide correct HTTP Authorization header.');
  }
}

interface ISimpleCache {
  [key: string]: any;
}

const authHeaderUserCache: ISimpleCache = {};
function getAuthHeaderCachedUser({ authHeader }: { authHeader: string }): IUser | false {
  if (authHeaderUserCache[authHeader] === undefined) return false;
  return authHeaderUserCache[authHeader];
}
function setAuthHeaderCachedUser({ authHeader, user }: { authHeader: string; user: IUser }): void {
  authHeaderUserCache[authHeader] = user;
  setTimeout(() => {
    authHeaderUserCache[authHeader] = undefined;
  }, 1000 * 60 * 5);
}
