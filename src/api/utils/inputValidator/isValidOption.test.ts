/* eslint-disable jest/no-commented-out-tests */
import { isValidOption } from './inputValidator.js';

describe('isValidOption', () => {
  test('Params have correct default values', () => {
    isValidOption({ option: 'TEST', validOptions: [] }, (params) => {
      expect(params.option).toBe('TEST');
      expect(params.validOptions).toEqual([]);
      expect(params.caseSensitive).toBe(true);
    });
  });
  test('It should return true if option is included in validOptions', () => {
    expect(isValidOption({ option: 'TEST', validOptions: ['VALUE1', 'TEST', 'VALUE3'] })).toBe(true);
    expect(isValidOption({ option: 'A', validOptions: ['A', 'B', 'C', 'D'] })).toBe(true);
    expect(isValidOption({ option: 'D', validOptions: ['A', 'B', 'C', 'D'] })).toBe(true);
  });
  test('It should return false if option is included in validOptions but case is incorrect', () => {
    expect(isValidOption({ option: 'test', validOptions: ['VALUE1', 'TEST', 'VALUE3'] })).toBe(false);
    expect(isValidOption({ option: 'a', validOptions: ['A', 'B', 'C', 'D'] })).toBe(false);
    expect(isValidOption({ option: 'd', validOptions: ['A', 'B', 'C', 'D'] })).toBe(false);
  });
  test('It should return true if option is included in validOptions but case is incorrect if caseSensitive=false', () => {
    expect(isValidOption({ option: 'test', validOptions: ['VALUE1', 'TEST', 'VALUE3'], caseSensitive: false })).toBe(
      true,
    );
    expect(isValidOption({ option: 'a', validOptions: ['A', 'B', 'C', 'D'], caseSensitive: false })).toBe(true);
    expect(isValidOption({ option: 'd', validOptions: ['A', 'B', 'C', 'D'], caseSensitive: false })).toBe(true);
  });

  test('It should return false if validOptions array length is 0', () => {
    expect(isValidOption({ option: '', validOptions: [], caseSensitive: false })).toBe(false);
    expect(isValidOption({ option: ' ', validOptions: [], caseSensitive: false })).toBe(false);
    expect(isValidOption({ option: 'a', validOptions: [], caseSensitive: false })).toBe(false);
    expect(isValidOption({ option: 'd', validOptions: [], caseSensitive: false })).toBe(false);
  });

  test('It returns false if it should be true, but extention function returns false', () => {
    expect(
      isValidOption({ option: 'd', validOptions: ['d'] }, (params): false | void => {
        if (params.validOptions.length === 1) return false;
      }),
    ).toBe(false);
  });
});
