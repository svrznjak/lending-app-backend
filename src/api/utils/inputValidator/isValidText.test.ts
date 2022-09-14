/* eslint-disable jest/no-commented-out-tests */
import { isValidText } from './inputValidator.js';

describe('isValidText', () => {
  test('Params have correct default values', () => {
    isValidText({ text: 'test' }, (params) => {
      expect(params.validEmpty).toBe(false);
      expect(params.minLength).toBe(0);
      expect(params.maxLength).toBe(Infinity);
    });
  });
  test('It returns false if text is empty or only spaces and validEmpty is false', () => {
    expect(
      isValidText({
        text: '',
        // implicit validEmpty false, because default value.
      }),
    ).toBe(false);
    expect(
      isValidText({
        text: ' ',
        validEmpty: false,
      }),
    ).toBe(false);
  });
  test('It returns true if text is empty or only spaces and valid empty is true', () => {
    expect(
      isValidText({
        text: '',
        validEmpty: true,
      }),
    ).toBe(true);
    expect(
      isValidText({
        text: ' ',
        validEmpty: true,
      }),
    ).toBe(true);
    expect(
      isValidText({
        text: ' ',
        validEmpty: true,
      }),
    ).toBe(true);
  });
  test('It returns true if text.length=0, minLength=0 and validEmpty=true', () => {
    expect(
      isValidText({
        text: '',
        validEmpty: true,
        // implicit minLenght=0, because default value.
      }),
    ).toBe(true);
    expect(
      isValidText({
        text: '',
        validEmpty: true,
        minLength: 0,
      }),
    ).toBe(true);
  });
  test('It returns false if text.length=0, minLength=0 and validEmpty=false', () => {
    expect(
      isValidText({
        text: '',
        validEmpty: false,
        // implicit minLenght=0, because default value.
      }),
    ).toBe(false);
    expect(
      isValidText({
        text: '',
        validEmpty: false,
        minLength: 0,
      }),
    ).toBe(false);
  });
  test('It returns false if text.length=5 and minLength=10', () => {
    expect(
      isValidText({
        text: 'Hello',
        minLength: 10,
      }),
    ).toBe(false);
  });
  test('It returns false if text.lenght=10 and maxLength=5', () => {
    expect(
      isValidText({
        text: 'Hello you!',
        maxLength: 5,
      }),
    ).toBe(false);
  });
  test('It returns false if it should be true, but extention function returns false', () => {
    expect(
      isValidText(
        {
          text: 'test',
          validEmpty: true,
        },
        (params): false | void => {
          if (params.text.length === 4) return false;
        },
      ),
    ).toBe(false);
  });
});
