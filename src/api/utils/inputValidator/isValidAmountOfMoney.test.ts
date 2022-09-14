/* eslint-disable jest/no-commented-out-tests */
import { isValidAmountOfMoney } from './inputValidator.js';

describe('isValidAmountOfMoney', () => {
  test('It returns true if amount is just right.', () => {
    expect(isValidAmountOfMoney({ amount: 2 })).toBe(true);
    expect(isValidAmountOfMoney({ amount: 100 })).toBe(true);
    expect(isValidAmountOfMoney({ amount: 2.51 })).toBe(true);
    expect(isValidAmountOfMoney({ amount: 100.1123 })).toBe(true);
    expect(isValidAmountOfMoney({ amount: 0 })).toBe(true);
  });
  test('It returns false if amount is negative value.', () => {
    expect(isValidAmountOfMoney({ amount: -1 })).toBe(false);
    expect(isValidAmountOfMoney({ amount: -992 })).toBe(false);
    expect(isValidAmountOfMoney({ amount: -3.22 })).toBe(false);
  });
  test('It returns false if amount is wrong data type.', () => {
    expect(isValidAmountOfMoney({ amount: NaN })).toBe(false);
    expect(isValidAmountOfMoney({ amount: Infinity })).toBe(false);
    expect(isValidAmountOfMoney({ amount: -Infinity })).toBe(false);
    expect(isValidAmountOfMoney({ amount: null })).toBe(false);
    expect(isValidAmountOfMoney({ amount: undefined })).toBe(false);
    expect(isValidAmountOfMoney({ amount: 9999999999999 })).toBe(false);
  });
  test('It returns false if it should be true, but extention function returns false', () => {
    expect(
      isValidAmountOfMoney(
        {
          amount: 9999999999,
        },
        (params): false | void => {
          if (params.amount >= 100000000) return false;
        },
      ),
    ).toBe(false);
  });
});
