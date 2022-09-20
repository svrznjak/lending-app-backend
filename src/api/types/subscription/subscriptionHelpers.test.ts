import { ISubscription } from './subscriptionInterface.js';
import { subscriptionHelpers } from './subscriptionHelpers.js';

describe('subscriptionHelpers.validateSubscription', () => {
  test('It works with perfect input', () => {
    const subscriptionValue: ISubscription = {
      revenuecatId: '1dasf32fasdf32',
      type: 'FREE',
    };
    subscriptionHelpers.validate.all(subscriptionValue);
    expect(subscriptionValue.revenuecatId).toBe('1dasf32fasdf32');
    expect(subscriptionValue.type).toBe('FREE');
  });

  test('It throws error if subcription type does not exist', () => {
    const subscriptionValue: any = {
      revenuecatId: '1dasf32fasdf32',
      type: 'ULTRA',
    };
    expect(() => {
      subscriptionHelpers.validate.all(subscriptionValue);
    }).toThrow();
  });
  test('It throws error if subcription type is lowercase', () => {
    const subscriptionValue: any = {
      revenuecatId: '1dasf32fasdf32',
      type: 'free',
    };
    expect(() => {
      subscriptionHelpers.validate.all(subscriptionValue);
    }).toThrow();
  });
});

describe('subscriptionHelpers.runtimeCast', () => {
  test('It works with perfect input', () => {
    const subscriptionValue: ISubscription = {
      revenuecatId: '1dasf32fasdf32',
      type: 'FREE',
    };
    subscriptionHelpers.runtimeCast(subscriptionValue);
    expect(subscriptionValue.revenuecatId).toBe('1dasf32fasdf32');
    expect(subscriptionValue.type).toBe('FREE');
  });

  test('It throws error type or revenuecatId is not a string', () => {
    expect(() => {
      subscriptionHelpers.runtimeCast({
        revenuecatId: '1dasf32fasdf32',
        type: 1,
      } as any);
    }).toThrow();

    expect(() => {
      subscriptionHelpers.runtimeCast({
        revenuecatId: true,
        type: 'FREE',
      } as any);
    }).toThrow();
  });
});
