import { sanitizeInterestRate } from './interestRateSanitizer.js';

describe('sanitizeInterestRate', () => {
  describe('type', () => {
    test('Not implemented / it should throw error.', () => {
      expect(() => {
        sanitizeInterestRate.type('xy');
      }).toThrow();
    });
  });
  describe('duration', () => {
    test('Not implemented / it should throw error.', () => {
      expect(() => {
        sanitizeInterestRate.type('xy');
      }).toThrow();
    });
  });
});
