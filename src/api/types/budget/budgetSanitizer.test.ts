import { sanitizeBudget } from './budgetSanitizer.js';

describe('sanitizeBudget', () => {
  describe('name', () => {
    test('It returns same input if input is okay.', () => {
      expect(sanitizeBudget.name('My new budget')).toBe('My new budget');
    });
    test('It trims spaces left and right.', () => {
      expect(sanitizeBudget.name('My new budget ')).toBe('My new budget');
      expect(sanitizeBudget.name('   My new budget ')).toBe('My new budget');
      expect(sanitizeBudget.name('        My new budget')).toBe('My new budget');
    });
  });

  describe('description', () => {
    test('It returns same input if input is okay.', () => {
      expect(sanitizeBudget.name('This loan budget is for fast loans.')).toBe('This loan budget is for fast loans.');
    });
    test('It trims spaces left and right.', () => {
      expect(sanitizeBudget.description('This loan budget is for fast loans.   ')).toBe(
        'This loan budget is for fast loans.',
      );
      expect(sanitizeBudget.description('   This loan budget is for fast loans. ')).toBe(
        'This loan budget is for fast loans.',
      );
      expect(sanitizeBudget.description('        This loan budget is for fast loans.')).toBe(
        'This loan budget is for fast loans.',
      );
    });
  });
});
