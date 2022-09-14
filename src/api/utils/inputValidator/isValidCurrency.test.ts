/* eslint-disable jest/no-commented-out-tests */
import { isValidCurrency } from './inputValidator.js';

import currencies from '../../types/currencies.js';

describe('isValidCurrency', () => {
  test('Params have correct default values', () => {
    isValidCurrency({ currency: 'sl-SI' }, (params) => {
      expect(params.caseSensitive).toBe(true);
    });
  });
  test('It returns true if string is just right', () => {
    expect(isValidCurrency({ currency: 'EUR' })).toBe(true);
  });
  test('It returns false if string is just right but lowercase', () => {
    expect(isValidCurrency({ currency: 'eur' })).toBe(false);
  });
  test('It returns true if string is just right but lowercase and caseSensitive=false', () => {
    expect(isValidCurrency({ currency: 'eur', caseSensitive: false })).toBe(true);
  });

  test('It returns false if string contains unexisting value.', () => {
    expect(isValidCurrency({ currency: 'AAA' })).toBe(false);
  });
  test('It returns false currency is not length of 3', () => {
    expect(isValidCurrency({ currency: 'ABC' })).toBe(false);
  });
  test('It returns false if string is empty.', () => {
    expect(isValidCurrency({ currency: '' })).toBe(false);
  });
  test('It returns false if string contains space', () => {
    expect(isValidCurrency({ currency: 'EUR ' })).toBe(false);
  });

  test('It returns false if it should be true, but extention function returns false', () => {
    expect(
      isValidCurrency(
        {
          currency: 'EUR',
        },
        (params): false | void => {
          if (params.currency === 'EUR') return false;
        },
      ),
    ).toBe(false);
  });
  test('It does not modify global locales.', () => {
    isValidCurrency({ currency: 'eur', caseSensitive: false });
    expect(currencies.includes('eur')).toBe(false);
  });
});
