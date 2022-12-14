import { ISubscription } from './subscriptionInterface.js';
import _ from 'lodash';
import { isValidOption } from '../../utils/inputValidator/inputValidator.js';

export const subscriptionHelpers = {
  validate: {
    all: function validateAll(subscription: ISubscription): ISubscription {
      this.revenuecatId(subscription.revenuecatId);
      this.type(subscription.type);
      return subscription;
    },
    revenuecatId: function validateRevenuecatId(revenuecatId: string): string {
      // TODO : Make more specific check for revenueCatId
      if (!revenuecatId) throw new Error('(validation) revenuecatId is invalid!');
      return revenuecatId;
    },
    type: function validateType(type: string): string {
      if (
        !isValidOption({
          option: type,
          validOptions: ['FREE', 'STANDARD', 'PREMIUM'],
          caseSensitive: true,
        })
      )
        throw new Error('(validation) Subscription type does not exist! Warning: types are case sensitive');
      return type;
    },
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
