/* eslint-disable jest/no-commented-out-tests */
import { isValidLanguage } from './inputValidator.js';

import locales from '../../types/locales.js';

describe('isValidLanguage', () => {
  test('Params have correct default values', () => {
    isValidLanguage({ language: 'sl-SI' }, (params) => {
      expect(params.caseSensitive).toBe(true);
    });
  });
  test('It returns true if string is just right.', () => {
    expect(isValidLanguage({ language: 'sl-SI' })).toBe(true);
  });
  test('It returns false if string is just right but lowercase.', () => {
    expect(isValidLanguage({ language: 'sl-si' })).toBe(false);
  });
  test('It returns true if string is just right but lowercase and caseSensitive=false.', () => {
    expect(isValidLanguage({ language: 'sl-si', caseSensitive: false })).toBe(true);
  });
  test('It returns false if string is empty.', () => {
    expect(isValidLanguage({ language: '' })).toBe(false);
  });
  test('It returns false if string is wrong.', () => {
    expect(isValidLanguage({ language: 'siSL' })).toBe(false);
  });
  test('It returns false if it should be true, but extention function returns false', () => {
    expect(
      isValidLanguage(
        {
          language: 'sl-SI',
        },
        (params): false | void => {
          if (params.language === 'sl-SI') return false;
        },
      ),
    ).toBe(false);
  });
  test('It does not modify global locales.', () => {
    isValidLanguage({ language: 'sl-si', caseSensitive: false });
    expect(locales.includes('sl-si')).toBe(false);
  });
});
