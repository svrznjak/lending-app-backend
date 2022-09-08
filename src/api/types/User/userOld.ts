/* import _ from 'lodash';

import { NewUserInput, Subscription, UpdateUserInput, User } from './interface.js';

import { sanitizeNewUserInput, sanitizeUpdateUserInput } from './UserSanitizer.js';
import { validateNewUserInput, validateUpdateUserInput } from './UserValidator.js';

export function castToUser(variable: any): User {
  if (typeof variable !== 'object' || variable === null) throw new Error('Type of User must be an object!');

  if (typeof variable._id !== 'object' || variable._id === null) throw new Error('Type of User._id must be an object!');

  if (!_.isString(variable.name)) throw new Error('Type of User.name must be a string!');

  if (!_.isString(variable.email)) throw new Error('Type of User.email must be a string!');

  if (!_.isString(variable.authId)) throw new Error('Type of User.authId must be a string!');

  if (!Array.isArray(variable.budgets)) throw new Error('Type of User.budgets must be an Array!');

  if (!Array.isArray(variable.loans)) throw new Error('Type of User.loans must be an Array!');

  if (!_.isString(variable.currency)) throw new Error('Type of User.currency must be a string!');

  if (!_.isString(variable.language)) throw new Error('Type of User.language must be a string!');

  const subscription = castToSubscription(variable.subscription);

  const castedUser: User = {
    _id: variable._id,
    name: variable.name,
    email: variable.email,
    authId: variable.authId,
    budgets: variable.budgets,
    loans: variable.loans,
    currency: variable.currency,
    language: variable.language,
    subscription: subscription,
  };

  return castedUser;
}

export function castToNewUserInput(variable: any): NewUserInput {
  if (typeof variable !== 'object' || variable === null) throw new Error('Type of NewUserInput must be an object!');

  if (!_.isString(variable.name)) throw new Error('Type of NewUserInput.name must be a string!');

  if (!_.isString(variable.email)) throw new Error('Type of NewUserInput.email must be a string!');

  if (!_.isString(variable.currency)) throw new Error('Type of NewUserInput.currency must be a string!');

  if (!_.isString(variable.language)) throw new Error('Type of NewUserInput.language must be a string!');

  const castedNewUserInput: NewUserInput = {
    name: variable.name,
    email: variable.email,
    currency: variable.currency,
    language: variable.language,
    validate: function () {
      return validateNewUserInput(this);
    },
    sanizize: function () {
      return sanitizeNewUserInput(this);
    },
  };

  return castedNewUserInput;
}

export function castToUpdateUserInput(variable: any): UpdateUserInput {
  const castedUpdateUserInput: UpdateUserInput = {
    validate: function () {
      return validateUpdateUserInput(this);
    },
    sanizize: function () {
      return sanitizeUpdateUserInput(this);
    },
  };

  if (typeof variable !== 'object' || variable === null) throw new Error('Type of UpdateUserInput must be an object!');

  if (!_.isString(variable.name) && variable.name != undefined) {
    throw new Error('Type of UpdateUserInput.name must be a string!');
  } else {
    castedUpdateUserInput.name = variable.name;
  }

  if (!_.isString(variable.currency) && variable.currency != undefined) {
    throw new Error('Type of UpdateUserInput.currency must be a string!');
  } else {
    castedUpdateUserInput.currency = variable.currency;
  }

  if (!_.isString(variable.language) && variable.language != undefined) {
    throw new Error('Type of UpdateUserInput.language must be a string!');
  } else {
    castedUpdateUserInput.language = variable.language;
  }

  return castedUpdateUserInput;
}

export function castToSubscription(variable: any): Subscription {
  if (typeof variable !== 'object' || variable === null) throw new Error('Type of Subscription must be an object!');

  if (!_.isString(variable.revenuecatId)) throw new Error('Type of Subscription.revenuecatId must be a string!');

  if (!_.isString(variable.type)) throw new Error('Type of Subscription.type must be a string!');

  const castedSubscription: Subscription = {
    revenuecatId: variable.revenuecatId,
    type: variable.type,
  };

  return castedSubscription;
}

export class NewUser implements NewUserInput {
  public name: string;
  public email: string;
  public currency: string;
  public language: string;

  constructor(variable: any) {
    if (typeof variable !== 'object' || variable === null) throw new Error('Type of NewUserInput must be an object!');
    if (!_.isString(variable.name)) throw new Error('Type of NewUserInput.name must be a string!');
    if (!_.isString(variable.email)) throw new Error('Type of NewUserInput.email must be a string!');
    if (!_.isString(variable.currency)) throw new Error('Type of NewUserInput.currency must be a string!');
    if (!_.isString(variable.language)) throw new Error('Type of NewUserInput.language must be a string!');
    this.name = variable.name;
    this.email = variable.email;
    this.currency = variable.currency;
    this.language = variable.language;
  }

  validate(): NewUserInput {
    validateNewUserInput(this);
    return validateNewUserInput(this);
  }
  sanizize(): NewUserInput {
    return sanitizeNewUserInput(this);
  }
}
*/
