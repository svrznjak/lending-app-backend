import { validateBudget } from './budgetValidator.js';

describe('validateBudget', () => {
  describe('isValidName', () => {
    test('It returns true if string is just right.', () => {
      expect(validateBudget.isValidName("Jack's account")).toBe(true);
    });
    test('It returns false if string is empty.', () => {
      expect(validateBudget.isValidName('')).toBe(false);
    });
    test('It returns false if string is longer than 100 characters.', () => {
      expect(
        validateBudget.isValidName(
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.',
        ),
      ).toBe(false);
    });
  });

  describe('isValidDescription', () => {
    test('It returns true if string is just right.', () => {
      expect(validateBudget.isValidDescription("Jack's account")).toBe(true);
    });
    test('It returns true if string is empty.', () => {
      expect(validateBudget.isValidDescription('')).toBe(true);
    });
    test('It returns false if string is longer than 1000 characters.', () => {
      expect(
        validateBudget.isValidDescription(
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.',
        ),
      ).toBe(false);
    });
  });
});
