import {
  NewUserInput,
  Subscription,
  UpdateUserInput,
  User,
} from '../interfaces/User.js';

export function castToUserAtRuntime(variable: any): User {
  if (
    typeof variable !== 'object' ||
    Array.isArray(variable) ||
    variable === null
  )
    throw new Error('Type of User must be an object!');

  if (typeof variable._id !== 'object' || variable._id === null)
    throw new Error('Type of User._id must be an object!');

  if (typeof variable.name !== 'string')
    throw new Error('Type of User.name must be a string!');

  if (typeof variable.email !== 'string')
    throw new Error('Type of User.email must be a string!');

  if (typeof variable.firebaseId !== 'string')
    throw new Error('Type of User.firebaseId must be a string!');

  if (Array.isArray(variable.budgets))
    throw new Error('Type of User.budgets must be an Array!');

  if (Array.isArray(variable.loans))
    throw new Error('Type of User.loans must be an Array!');

  if (typeof variable.currency !== 'string')
    throw new Error('Type of User.currency must be a string!');

  if (typeof variable.language !== 'string')
    throw new Error('Type of User.language must be a string!');

  if (typeof variable.timezone !== 'string')
    throw new Error('Type of User.timezone must be a string!');

  const subscription = castToSubscriptionAtRuntime(variable.subscription);

  const castedUser: User = {
    _id: variable._id,
    name: variable.name,
    email: variable.email,
    firebaseId: variable.firebaseId,
    budgets: variable.budgets,
    loans: variable.loans,
    currency: variable.currency,
    language: variable.language,
    timezone: variable.timezone,
    subscription: subscription,
  };

  return castedUser;
}

export function castToNewUserInputAtRuntime(variable: any): NewUserInput {
  if (
    typeof variable !== 'object' ||
    Array.isArray(variable) ||
    variable === null
  )
    throw new Error('Type of NewUserInput must be an object!');

  if (typeof variable.name === 'string')
    throw new Error('Type of NewUserInput.name must be a string!');

  if (typeof variable.email === 'string')
    throw new Error('Type of NewUserInput.email must be a string!');

  if (typeof variable.currency === 'string')
    throw new Error('Type of NewUserInput.currency must be a string!');

  if (typeof variable.language === 'string')
    throw new Error('Type of NewUserInput.language must be a string!');

  if (typeof variable.timezone === 'string')
    throw new Error('Type of NewUserInput.timezone must be a string!');

  const castedNewUserInput: NewUserInput = {
    name: variable.name,
    email: variable.email,
    currency: variable.currency,
    language: variable.language,
    timezone: variable.timezone,
  };

  return castedNewUserInput;
}

export function castToUpdateUserInputAtRuntime(variable: any): UpdateUserInput {
  if (
    typeof variable !== 'object' ||
    Array.isArray(variable) ||
    variable === null
  )
    throw new Error('Type of UpdateUserInput must be an object!');

  if (typeof variable.name === 'string' || undefined)
    throw new Error('Type of UpdateUserInput.name must be a string!');

  if (typeof variable.currency === 'string' || undefined)
    throw new Error('Type of UpdateUserInput.currency must be a string!');

  if (typeof variable.language === 'string' || undefined)
    throw new Error('Type of UpdateUserInput.language must be a string!');

  if (typeof variable.timezone === 'string' || undefined)
    throw new Error('Type of UpdateUserInput.timezone must be a string!');

  const castedUpdateUserInput: UpdateUserInput = {
    name: variable.name,
    currency: variable.currency,
    language: variable.language,
    timezone: variable.timezone,
  };

  return castedUpdateUserInput;
}

export function castToSubscriptionAtRuntime(variable: any): Subscription {
  if (
    typeof variable !== 'object' ||
    Array.isArray(variable) ||
    variable === null
  )
    throw new Error('Type of Subscription must be an object!');

  if (typeof variable.revenuecatId === 'string' || undefined)
    throw new Error('Type of Subscription.revenuecatId must be a string!');

  if (typeof variable.type === 'string' || undefined)
    throw new Error('Type of Subscription.type must be a string!');

  const castedSubscription: Subscription = {
    revenuecatId: variable.revenuecatId,
    type: variable.type,
  };

  return castedSubscription;
}
