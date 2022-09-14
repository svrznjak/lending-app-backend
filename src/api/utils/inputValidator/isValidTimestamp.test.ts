/* eslint-disable jest/no-commented-out-tests */
import { isValidTimestamp } from './inputValidator.js';

describe('isValidTimestamp', () => {
  test('It returns true if timestamp is just right.', () => {
    expect(isValidTimestamp({ timestamp: 1 })).toBe(true);
    expect(isValidTimestamp({ timestamp: 300000 })).toBe(true);
    expect(isValidTimestamp({ timestamp: 12312358709 })).toBe(true);
    expect(isValidTimestamp({ timestamp: 123e-3 })).toBe(true);
    expect(isValidTimestamp({ timestamp: 0x11 })).toBe(true);
  });
  test('It returns false if timestamp is of wrong data type.', () => {
    expect(isValidTimestamp({ timestamp: NaN })).toBe(false);
    expect(isValidTimestamp({ timestamp: Infinity })).toBe(false);
    expect(isValidTimestamp({ timestamp: null })).toBe(false);
    expect(isValidTimestamp({ timestamp: undefined })).toBe(false);
    expect(isValidTimestamp({ timestamp: 50000000000000000 })).toBe(false);
  });

  test('It returns false if timestamp is negative.', () => {
    expect(isValidTimestamp({ timestamp: -1 })).toBe(false);
    expect(isValidTimestamp({ timestamp: -123e-3 })).toBe(false);
    expect(isValidTimestamp({ timestamp: -0x11 })).toBe(false);
  });
  test('It returns false if it should be true, but extention function returns false', () => {
    expect(
      isValidTimestamp(
        {
          timestamp: 1757876526,
        },
        (params): false | void => {
          if (params.timestamp >= 1663182126) return false;
        },
      ),
    ).toBe(false);
  });
});
