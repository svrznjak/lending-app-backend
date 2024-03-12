import { FastifyInstance } from 'fastify';
import auth from '../api/auth.js';
import { getUserByAuthId } from '../api/user.js';
import { IUser } from '../api/types/user/userInterface.js';

import budget from '../api/budget.js';
import budgetCache from '../api/cache/budgetCache.js';
import loan from '../api/loan.js';
import loanCache from '../api/cache/loanCache.js';
import customer from '../api/customer.js';
import customerCache from '../api/cache/customerCache.js';

export default function configureHttpRoutes(fastify: FastifyInstance): void {
  fastify.get('/api/budgets', async (req, reply) => {
    const user = await getUserFromAuthHeader(req.headers.authorization);
    if (req.headers['if-none-match'] === budgetCache.getCachedItemEtag({ userId: user._id }))
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
  fastify.get('/api/budget-with-transactions', async (req, reply) => {
    const user = await getUserFromAuthHeader(req.headers.authorization);
    if (req.headers['if-none-match'] == budgetCache.getCachedItemEtag({ userId: user._id }))
      return reply.status(304).send();
    const queryParams = req.query as any;
    const budgetItem = await budget.getOneFromUser({ userId: user._id, budgetId: queryParams.id });

    reply.header('ETag', budgetCache.getCachedItemEtag({ userId: user._id }));

    const loans = await loan.getFromUser({ userId: user._id });

    const transactions = [];
    for (const transaction of budgetItem.transactionList) {
      const tran = {
        _id: transaction._id,
        amount: transaction.amount,
        description: transaction.description,
        timestamp: transaction.timestamp,
        from: {
          datatype: transaction.from.datatype,
          addressId: transaction.from.addressId,
        },
        to: {
          datatype: transaction.to.datatype,
          addressId: transaction.to.addressId,
        },
        loan: undefined,
      };
      const fromLoan = loans.find((loan) => loan._id === transaction.from.addressId.toString());
      const toLoan = loans.find((loan) => loan._id === transaction.to.addressId.toString());
      if (fromLoan)
        tran.loan = {
          name: fromLoan.name,
          status: fromLoan.status,
        };
      if (toLoan)
        tran.loan = {
          name: toLoan.name,
          status: toLoan.status,
        };
      transactions.push(tran);
    }

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
      transactionList: transactions,
    };
  });
  fastify.get('/api/loans', async (req, reply) => {
    const user = await getUserFromAuthHeader(req.headers.authorization);
    if (req.headers['if-none-match'] === loanCache.getCachedItemEtag({ userId: user._id }))
      return reply.status(304).send();

    const fullLoans = await loan.getFromUser({ userId: user._id });
    const customers = await customer.getAllFromUser({ userId: user._id });
    reply.header('ETag', loanCache.getCachedItemEtag({ userId: user._id }));
    return fullLoans.map((loan) => {
      const customer =
        loan.customerId !== undefined
          ? customers.find((customer) => customer._id === loan.customerId.toString())
          : undefined;
      return {
        _id: loan._id,
        name: loan.name,
        description: loan.description,
        customer: customer
          ? {
              _id: customer._id,
              name: customer.name,
              address: customer.address,
              email: customer.email,
              phone: customer.phone,
            }
          : undefined,
        openedTimestamp: loan.openedTimestamp,
        closesTimestamp: loan.closesTimestamp,
        status: {
          current: loan.status.current,
          timestamp: loan.status.timestamp,
        },
        paymentFrequency: {
          occurrence: loan.paymentFrequency.occurrence,
          isStrict: loan.paymentFrequency.isStrict,
          strictValue: loan.paymentFrequency.strictValue,
        },
        expectedPayments: loan.expectedPayments.map((payment) => {
          return {
            paymentDate: payment.paymentDate,
            outstandingPrincipalBeforePayment: payment.outstandingPrincipalBeforePayment,
            totalPaidPrincipalBeforePayment: payment.totalPaidPrincipalBeforePayment,
            principalPayment: payment.principalPayment,
            interestPayment: payment.interestPayment,
          };
        }),
        calculatedInvestedAmount: loan.calculatedInvestedAmount,
        calculatedTotalPaidPrincipal: loan.calculatedTotalPaidPrincipal,
        calculatedOutstandingPrincipal: loan.calculatedOutstandingPrincipal,
        calculatedOutstandingInterest: loan.calculatedOutstandingInterest,
        calculatedOutstandingFees: loan.calculatedOutstandingFees,
        calculatedPaidInterest: loan.calculatedPaidInterest,
        calculatedPaidFees: loan.calculatedPaidFees,
        calculatedTotalForgivenPrincipal: loan.calculatedTotalForgivenPrincipal,
        calculatedTotalForgivenInterest: loan.calculatedTotalForgivenInterest,
        calculatedTotalForgivenFees: loan.calculatedTotalForgivenFees,
        calculatedLastTransactionTimestamp: loan.calculatedLastTransactionTimestamp,
        calculatedRelatedBudgets: loan.calculatedRelatedBudgets,
      };
    });
  });
  fastify.get('/api/loan', async (req, reply) => {
    const user = await getUserFromAuthHeader(req.headers.authorization);
    if (req.headers['if-none-match'] === loanCache.getCachedItemEtag({ userId: user._id }))
      return reply.status(304).send();

    const queryParams = req.query as any;

    const fullLoan = await loan.getOneFromUser({ userId: user._id, loanId: queryParams.id });
    const customers = await customer.getAllFromUser({ userId: user._id });
    reply.header('ETag', loanCache.getCachedItemEtag({ userId: user._id }));
    const loanCustomer =
      fullLoan.customerId !== undefined
        ? customers.find((customer) => customer._id === fullLoan.customerId.toString())
        : undefined;
    return {
      _id: fullLoan._id,
      name: fullLoan.name,
      description: fullLoan.description,
      customer: loanCustomer
        ? {
            _id: loanCustomer._id,
            name: loanCustomer.name,
            address: loanCustomer.address,
            email: loanCustomer.email,
            phone: loanCustomer.phone,
          }
        : undefined,
      openedTimestamp: fullLoan.openedTimestamp,
      closesTimestamp: fullLoan.closesTimestamp,
      notes: fullLoan.notes,
      status: {
        current: fullLoan.status.current,
        timestamp: fullLoan.status.timestamp,
      },
      paymentFrequency: {
        occurrence: fullLoan.paymentFrequency.occurrence,
        isStrict: fullLoan.paymentFrequency.isStrict,
        strictValue: fullLoan.paymentFrequency.strictValue,
      },
      expectedPayments: fullLoan.expectedPayments.map((payment) => {
        return {
          paymentDate: payment.paymentDate,
          outstandingPrincipalBeforePayment: payment.outstandingPrincipalBeforePayment,
          totalPaidPrincipalBeforePayment: payment.totalPaidPrincipalBeforePayment,
          principalPayment: payment.principalPayment,
          interestPayment: payment.interestPayment,
        };
      }),
      calculatedInvestedAmount: fullLoan.calculatedInvestedAmount,
      calculatedTotalPaidPrincipal: fullLoan.calculatedTotalPaidPrincipal,
      calculatedOutstandingPrincipal: fullLoan.calculatedOutstandingPrincipal,
      calculatedOutstandingInterest: fullLoan.calculatedOutstandingInterest,
      calculatedOutstandingFees: fullLoan.calculatedOutstandingFees,
      calculatedPaidInterest: fullLoan.calculatedPaidInterest,
      calculatedPaidFees: fullLoan.calculatedPaidFees,
      calculatedTotalForgivenPrincipal: fullLoan.calculatedTotalForgivenPrincipal,
      calculatedTotalForgivenInterest: fullLoan.calculatedTotalForgivenInterest,
      calculatedTotalForgivenFees: fullLoan.calculatedTotalForgivenFees,
      calculatedLastTransactionTimestamp: fullLoan.calculatedLastTransactionTimestamp,
      calculatedRelatedBudgets: fullLoan.calculatedRelatedBudgets,
      transactionList: fullLoan.transactionList,
    };
  });
  fastify.get('/api/customers', async (req, reply) => {
    const user = await getUserFromAuthHeader(req.headers.authorization);
    if (req.headers['if-none-match'] === customerCache.getCachedItemEtag({ userId: user._id }))
      return reply.status(304).send();

    const fullCustomers = await customer.getAllFromUser({ userId: user._id });
    reply.header('ETag', customerCache.getCachedItemEtag({ userId: user._id }));
    return fullCustomers.map((customer) => {
      return {
        _id: customer._id,
        name: customer.name,
        address: customer.address,
        email: customer.email,
        phone: customer.phone,
        isArchived: customer.isArchived,
      };
    });
  });
  fastify.get('/api/customer', async (req, reply) => {
    const user = await getUserFromAuthHeader(req.headers.authorization);
    if (req.headers['if-none-match'] === customerCache.getCachedItemEtag({ userId: user._id }))
      return reply.status(304).send();

    const queryParams = req.query as any;

    const fullCustomer = await customer.getOneFromUser({ userId: user._id, customerId: queryParams.id });
    reply.header('ETag', customerCache.getCachedItemEtag({ userId: user._id }));
    return {
      _id: fullCustomer._id,
      name: fullCustomer.name,
      address: fullCustomer.address,
      email: fullCustomer.email,
      phone: fullCustomer.phone,
      isArchived: fullCustomer.isArchived,
      notes: fullCustomer.notes.map((note) => {
        return {
          _id: note._id,
          content: note.content,
          entryTimestamp: note.entryTimestamp,
        };
      }),
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
