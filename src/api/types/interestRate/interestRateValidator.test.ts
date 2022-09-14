import { validateInterestRate } from './interestRateValidator.js';

describe('validateInterestRate', () => {
  describe('isValidType', () => {
    test('It returns true if string is just right.', () => {
      expect(validateInterestRate.isValidType('PERCENTAGE_PER_DURATION')).toBe(true);
      expect(validateInterestRate.isValidType('FIXED_PER_DURATION')).toBe(true);
    });
    test('It returns false if string is just right but lowercase.', () => {
      expect(validateInterestRate.isValidType('percentage_per_duration')).toBe(false);
      expect(validateInterestRate.isValidType('fixed_per_duration')).toBe(false);
    });
    test('It returns false if string is empty.', () => {
      expect(validateInterestRate.isValidType('')).toBe(false);
    });
    test('It returns false if type does not exists.', () => {
      expect(validateInterestRate.isValidType('FIXED')).toBe(false);
      expect(validateInterestRate.isValidType('FIXED_PER_FOREVER')).toBe(false);
    });
  });
  describe('isValidDuration', () => {
    test('It returns true if string is just right.', () => {
      expect(validateInterestRate.isValidDuration('DAY')).toBe(true);
      expect(validateInterestRate.isValidDuration('WEEK')).toBe(true);
      expect(validateInterestRate.isValidDuration('MONTH')).toBe(true);
      expect(validateInterestRate.isValidDuration('YEAR')).toBe(true);
      expect(validateInterestRate.isValidDuration('FULL_DURATION')).toBe(true);
    });
    test('It returns false if string is just right but lowercase.', () => {
      expect(validateInterestRate.isValidDuration('day')).toBe(false);
      expect(validateInterestRate.isValidDuration('week')).toBe(false);
      expect(validateInterestRate.isValidDuration('month')).toBe(false);
      expect(validateInterestRate.isValidDuration('year')).toBe(false);
      expect(validateInterestRate.isValidDuration('full_duration')).toBe(false);
    });
    test('It returns false if string is empty.', () => {
      expect(validateInterestRate.isValidDuration('')).toBe(false);
    });
    test('It returns false if type does not exists.', () => {
      expect(validateInterestRate.isValidDuration('MINUTE')).toBe(false);
      expect(validateInterestRate.isValidDuration('SECOND')).toBe(false);
      expect(validateInterestRate.isValidDuration('DECADE')).toBe(false);
    });
  });

  describe('isValidAmount', () => {
    test('It returns true if interest amount is just right.', () => {
      expect(validateInterestRate.isValidAmount(1)).toBe(true);
      expect(validateInterestRate.isValidAmount(1.3)).toBe(true);
      expect(validateInterestRate.isValidAmount(100)).toBe(true);
      expect(validateInterestRate.isValidAmount(123e-3)).toBe(true);
      expect(validateInterestRate.isValidAmount(0x11)).toBe(true);
    });
    test('It returns false if interest amount is of wrong value.', () => {
      expect(validateInterestRate.isValidAmount(NaN)).toBe(false);
      expect(validateInterestRate.isValidAmount(Infinity)).toBe(false);
      expect(validateInterestRate.isValidAmount(null)).toBe(false);
      expect(validateInterestRate.isValidAmount(undefined)).toBe(false);
    });

    test('It returns false if interest amount is negative.', () => {
      expect(validateInterestRate.isValidAmount(-1)).toBe(false);
      expect(validateInterestRate.isValidAmount(-1.3)).toBe(false);
      expect(validateInterestRate.isValidAmount(-100)).toBe(false);
      expect(validateInterestRate.isValidAmount(-123e-3)).toBe(false);
      expect(validateInterestRate.isValidAmount(-0x11)).toBe(false);
    });
  });

  describe('isValidEntryTimestamp', () => {
    test('It returns true if interest amount is just right.', () => {
      expect(validateInterestRate.isValidEntryTimestamp(1)).toBe(true);
      expect(validateInterestRate.isValidEntryTimestamp(300000)).toBe(true);
      expect(validateInterestRate.isValidEntryTimestamp(12312358709)).toBe(true);
      expect(validateInterestRate.isValidEntryTimestamp(123e-3)).toBe(true);
      expect(validateInterestRate.isValidEntryTimestamp(0x11)).toBe(true);
    });
    test('It returns false if interest amount is of wrong value.', () => {
      expect(validateInterestRate.isValidEntryTimestamp(NaN)).toBe(false);
      expect(validateInterestRate.isValidEntryTimestamp(Infinity)).toBe(false);
      expect(validateInterestRate.isValidEntryTimestamp(null)).toBe(false);
      expect(validateInterestRate.isValidEntryTimestamp(undefined)).toBe(false);
      expect(validateInterestRate.isValidEntryTimestamp(50000000000000000)).toBe(false);
    });

    test('It returns false if interest amount is negative.', () => {
      expect(validateInterestRate.isValidEntryTimestamp(-1)).toBe(false);
      expect(validateInterestRate.isValidEntryTimestamp(-123e-3)).toBe(false);
      expect(validateInterestRate.isValidEntryTimestamp(-0x11)).toBe(false);
    });
  });
});
