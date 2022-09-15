import { ISubscription } from './subscriptionInterface.js';
import _ from 'lodash';
import { isValidOption } from '../../utils/inputValidator/inputValidator.js';

export const subscriptionHelpers = {
  validateSubscription: function validateSubscription(subscription: ISubscription): ISubscription {
    // TODO : Make more specific check for revenueCatId
    if (!subscription.revenuecatId) throw new Error('(validation) revenuecatId is invalid!');
    if (
      !isValidOption({
        option: subscription.type,
        validOptions: ['FREE', 'STANDARD', 'PREMIUM'],
        caseSensitive: true,
      })
    )
      throw new Error('(validation) Subscription type does not exist! Warning: types are case sensitive');
    return subscription;
  },
  runtimeCast: function runtimeCast(subscription: any): ISubscription {
    if (typeof this !== 'object' || this === null) throw new Error('Type of User must be an object!');
    if (!_.isString(subscription.revenuecatId)) throw new Error('Type of subscription.revenuecatId must be a string!');
    if (!_.isString(subscription.type)) throw new Error('Type of subscription.type must be a string!');

    return {
      revenuecatId: subscription.name,
      type: subscription.type,
    };
  },
};
