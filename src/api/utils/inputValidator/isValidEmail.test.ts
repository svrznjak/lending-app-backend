/* eslint-disable jest/no-commented-out-tests */
import { isValidEmail } from './inputValidator.js';

describe('isValidEmail', () => {
  test('It returns true if string is just right.', () => {
    expect(isValidEmail({ email: 'my.email@ggmail.com' })).toBe(true);
  });
  test('It returns false if string is not an email.', () => {
    expect(isValidEmail({ email: 'ggmail.com' })).toBe(false);
  });
  test('It returns false if string is empty.', () => {
    expect(isValidEmail({ email: '' })).toBe(false);
  });
  test('It returns false if it should be true, but extention function returns false', () => {
    expect(
      isValidEmail(
        {
          email: 't@e.c',
        },
        (params): false | void => {
          if (params.email.length <= 5) return false;
        },
      ),
    ).toBe(false);
  });
});
