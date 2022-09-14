import validator from './userValidator.js';

describe('isValidName', () => {
  test('It returns true if string is just right.', () => {
    const name = "Jack's account";
    expect(validator.isValidName(name)).toBe(true);
  });
  test('It returns false if string is empty.', () => {
    expect(validator.isValidName('')).toBe(false);
  });
  test('It returns false if string is longer than 100 characters.', () => {
    expect(
      validator.isValidName(
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.',
      ),
    ).toBe(false);
  });
});

describe('isValidEmail', () => {
  test('It returns true if string is just right.', () => {
    const email = 'my.email@ggmail.com';
    expect(validator.isValidEmail(email)).toBe(true);
  });
  test('It returns false if string is not an email.', () => {
    const email = 'ggmail.com';
    expect(validator.isValidEmail(email)).toBe(false);
  });
  test('It returns false if string is empty.', () => {
    const email = '';
    expect(validator.isValidEmail(email)).toBe(false);
  });
});

describe('isValidCurrency', () => {
  test('It returns true if string is just right.', () => {
    const input = 'EUR';
    expect(validator.isValidCurrency(input)).toBe(true);
  });
  test('It returns false if string is just right but lowercase.', () => {
    const input = 'eur';
    expect(validator.isValidCurrency(input)).toBe(false);
  });
  test('It returns false currency is not length of 3.', () => {
    const input = 'ABCD';
    expect(validator.isValidCurrency(input)).toBe(false);
  });
  test('It returns false if string contains space.', () => {
    const input = 'EUR ';
    expect(validator.isValidCurrency(input)).toBe(false);
  });
  test('It returns false if string contains unexisting value.', () => {
    const input = 'AAA';
    expect(validator.isValidCurrency(input)).toBe(false);
  });
});

describe('isValidLanguage', () => {
  test('It returns true if string is just right.', () => {
    const input = 'sl-SI';
    expect(validator.isValidLanguage(input)).toBe(true);
  });
  test('It returns false if string is just right but lowercase.', () => {
    const input = 'sl-si';
    expect(validator.isValidLanguage(input)).toBe(false);
  });
  test('It returns false if string is empty.', () => {
    const input = '';
    expect(validator.isValidLanguage(input)).toBe(false);
  });
  test('It returns false if string is wrong.', () => {
    const input = 'siSL';
    expect(validator.isValidLanguage(input)).toBe(false);
  });
});
