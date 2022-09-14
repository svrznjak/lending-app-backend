import validator from './subscriptionValidator.js';

describe('isValidType', () => {
  test('It returns true if string is just right.', () => {
    expect(validator.isValidType('FREE')).toBe(true);
    expect(validator.isValidType('STANDARD')).toBe(true);
    expect(validator.isValidType('PREMIUM')).toBe(true);
  });
  test('It returns false if string is just right but lowercase.', () => {
    expect(validator.isValidType('free')).toBe(false);
    expect(validator.isValidType('Standard')).toBe(false);
    expect(validator.isValidType('preMIum')).toBe(false);
  });
  test('It returns false if string is empty.', () => {
    expect(validator.isValidType('')).toBe(false);
  });
  test('It returns false if type does not exists.', () => {
    expect(validator.isValidType('SUPER')).toBe(false);
    expect(validator.isValidType('FRRE')).toBe(false);
    expect(validator.isValidType('ultra')).toBe(false);
  });
});
