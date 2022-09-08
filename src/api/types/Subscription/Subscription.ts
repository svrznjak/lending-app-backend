import _ from 'lodash';

import { ISubscription } from './interface.js';

export class Subscription implements ISubscription {
  public revenuecatId: string;
  public type: 'FREE' | 'STANDARD' | 'PREMIUM';

  constructor(subscription: ISubscription) {
    this.revenuecatId = subscription.revenuecatId;
    this.type = subscription.type;
  }

  detach(): ISubscription {
    // Detach info from current UserRegistration object
    return {
      revenuecatId: this.revenuecatId,
      type: this.type,
    };
  }

  runtimeDataTypeCheck(): Subscription {
    if (typeof this !== 'object' || this === null) throw new Error('Type of User must be an object!');
    if (!_.isString(this.revenuecatId)) throw new Error('Type of Subscription.revenuecatId must be a string!');
    if (!_.isString(this.type)) throw new Error('Type of Subscription.type must be a string!');

    return this;
  }
}
