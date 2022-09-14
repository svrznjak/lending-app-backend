import { IInterestRate } from './interestRateInterface.js';
import { interestRateHelpers } from './interestRateHelpers.js';

describe('interestRateHelpers', () => {
  describe('validate', () => {
    test('It works with perfect input', () => {
      const input = {
        type: 'PERCENTAGE_PER_DURATION',
        duration: 'MONTH',
        amount: 5,
        entryTimestamp: 1663012853,
        revisions: [],
      } as IInterestRate;
      const result = interestRateHelpers.validate(input);

      // Check if it does not modify original object
      expect(input.type).toBe('PERCENTAGE_PER_DURATION');
      expect(input.duration).toBe('MONTH');
      expect(input.amount).toBe(5);
      expect(input.entryTimestamp).toBe(1663012853);
      expect(input.revisions).toEqual([]);

      // Check if result is same as input
      expect(result.type).toBe(input.type);
      expect(result.duration).toBe(input.duration);
      expect(result.amount).toBe(input.amount);
      expect(result.entryTimestamp).toBe(input.entryTimestamp);
      expect(result.revisions).toEqual(input.revisions);
    });

    test('It throws error if input is not ok', () => {
      expect(() => {
        interestRateHelpers.validate({
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
          amount: -9999999999999999,
          entryTimestamp: 1663012853,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.validate({
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: -1,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.validate({
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: NaN,
          entryTimestamp: 1663012853,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.validate({
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: Infinity,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.validate({
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'WEEK',
          amount: null,
          entryTimestamp: 1663012853,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.validate({
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: null,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.validate({
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
          entryTimestamp: 9999999999999999999999,
          revisions: [],
        });
      }).toThrow();
    });
  });

  describe('runtimeCast', () => {
    test('It works with perfect input', () => {
      const input = {
        type: 'PERCENTAGE_PER_DURATION',
        duration: 'MONTH',
        amount: 5,
        entryTimestamp: 1663012853,
        revisions: [],
      };
      const result = interestRateHelpers.runtimeCast(input);

      // Check if it does not modify original object
      expect(input.type).toBe('PERCENTAGE_PER_DURATION');
      expect(input.duration).toBe('MONTH');
      expect(input.amount).toBe(5);
      expect(input.entryTimestamp).toBe(1663012853);
      expect(input.revisions).toEqual([]);

      // Check if result is same as input
      expect(result.type).toBe(input.type);
      expect(result.duration).toBe(input.duration);
      expect(result.amount).toBe(input.amount);
      expect(result.entryTimestamp).toBe(input.entryTimestamp);
      expect(result.revisions).toEqual(input.revisions);
    });
    test('It throws error if input is not ok', () => {
      expect(() => {
        interestRateHelpers.runtimeCast({
          type: null,
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.runtimeCast({
          type: new Object(),
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.runtimeCast({
          type: true,
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.runtimeCast({
          type: 'PERCENTAGE_PER_DURATION',
          duration: true,
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.runtimeCast({
          type: 'PERCENTAGE_PER_DURATION',
          duration: undefined,
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.runtimeCast({
          type: 'PERCENTAGE_PER_DURATION',
          duration: null,
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.runtimeCast({
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: NaN,
          entryTimestamp: 1663012853,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.runtimeCast({
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: true,
          entryTimestamp: 1663012853,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.runtimeCast({
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: true,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.runtimeCast({
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: NaN,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.runtimeCast({
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.runtimeCast({
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.runtimeCast('test');
      }).toThrow();
      expect(() => {
        interestRateHelpers.runtimeCast({
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: new Object(),
        });
      }).toThrow();
      expect(() => {
        interestRateHelpers.runtimeCast({
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 100,
          entryTimestamp: Infinity,
          revisions: [],
        });
      }).toThrow();
    });
  });
});
