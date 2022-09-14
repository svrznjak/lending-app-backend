/* eslint-disable jest/no-commented-out-tests */
import { budgetHelpers } from './budgetHelpers.js';
import { IBudget } from './budgetInterface.js';

describe('interestRateHelpers', () => {
  describe('validate', () => {
    const correctValidationInputs: Pick<IBudget, 'name' | 'description' | 'defaultInterestRate'>[] = [
      {
        name: 'Budget 1',
        description: 'Budget for risky loans.',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        },
      },
      {
        name: 'Budget 2',
        description: '',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'WEEK',
          amount: 0,
          entryTimestamp: 1663017539,
          revisions: [],
        },
      },
      {
        name: 'Other',
        description: 'Budget for risky loans.',
        defaultInterestRate: {
          type: 'FIXED_PER_DURATION',
          duration: 'FULL_DURATION',
          amount: 5,
          entryTimestamp: 1663024156,
          revisions: [],
        },
      },
    ];
    test.each(correctValidationInputs)('It works with correct input', (input) => {
      const result = budgetHelpers.validate(input);
      expect(result).toEqual(input);
    });

    const invalidValidationInputs: Pick<IBudget, 'name' | 'description' | 'defaultInterestRate'>[] = [
      {
        // To short name
        name: '',
        description: 'Budget for risky loans.',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        },
      },
      {
        // To long name
        name: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.',
        description: 'Budget for risky loans.',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        },
      },
      {
        // To long description
        name: 'Budget 1',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        },
      },
      {
        // To long description (+1000 chars)
        name: 'Budget 1',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        },
      },
      {
        // defaultInterestRate.amount is negative
        name: 'Budget',
        description: 'Budget for risky loans.',
        defaultInterestRate: {
          type: 'FIXED_PER_DURATION',
          duration: 'FULL_DURATION',
          amount: -1,
          entryTimestamp: 1663024156,
          revisions: [],
        },
      },
      {
        // defaultInterestRate.amount is NaN
        name: 'Budget',
        description: 'Budget for risky loans.',
        defaultInterestRate: {
          type: 'FIXED_PER_DURATION',
          duration: 'FULL_DURATION',
          amount: NaN,
          entryTimestamp: 1663024156,
          revisions: [],
        },
      },
      {
        // defaultInterestRate.amount is infinty
        name: 'Budget',
        description: 'Budget for risky loans.',
        defaultInterestRate: {
          type: 'FIXED_PER_DURATION',
          duration: 'FULL_DURATION',
          amount: Infinity,
          entryTimestamp: 1663024156,
          revisions: [],
        },
      },
      {
        // defaultInterestRate.entryTimestamp is negative
        name: 'Budget',
        description: 'Budget for risky loans.',
        defaultInterestRate: {
          type: 'FIXED_PER_DURATION',
          duration: 'FULL_DURATION',
          amount: 1,
          entryTimestamp: -1,
          revisions: [],
        },
      },
      {
        // defaultInterestRate.entryTimestamp is Infinity
        name: 'Budget',
        description: 'Budget for risky loans.',
        defaultInterestRate: {
          type: 'FIXED_PER_DURATION',
          duration: 'FULL_DURATION',
          amount: 1,
          entryTimestamp: Infinity,
          revisions: [],
        },
      },
      {
        // defaultInterestRate.entryTimestamp is null
        name: 'Budget',
        description: 'Budget for risky loans.',
        defaultInterestRate: {
          type: 'FIXED_PER_DURATION',
          duration: 'FULL_DURATION',
          amount: 1,
          entryTimestamp: null,
          revisions: [],
        },
      },
      {
        // defaultInterestRate.entryTimestamp is null
        name: 'Budget',
        description: 'Budget for risky loans.',
        defaultInterestRate: {
          type: 'FIXED_PER_DURATION',
          duration: 'FULL_DURATION',
          amount: 1,
          entryTimestamp: null,
          revisions: [],
        },
      },
    ];
    test.each(invalidValidationInputs)('It throws error if input is invalid', (input) => {
      expect(() => {
        budgetHelpers.validate(input);
      }).toThrow();
    });
  });

  describe('sanitize', () => {
    test('It works with correct input', () => {
      {
        // Name and description get trimmed
        const input = {
          _id: 'xxx',
          name: ' Budget 1    ',
          description: '   Budget for risky loans.',
          defaultInterestRate: {
            type: 'PERCENTAGE_PER_DURATION',
            duration: 'MONTH',
            amount: 5,
            entryTimestamp: 1663012853,
            revisions: [],
          },
          calculatedTotalAmount: 0,
          calculatedLendedAmount: 0,
        } as IBudget;
        budgetHelpers.sanitize(input);
        expect(input.name).toBe('Budget 1');
        expect(input.description).toBe('Budget for risky loans.');
      }
      {
        // Name and description get trimmed when only name and description are passed
        const input = {
          name: '  Budget 1',
          description: ' Budget for risky loans.  ',
        } as IBudget;
        budgetHelpers.sanitize(input);
        expect(input.name).toBe('Budget 1');
        expect(input.description).toBe('Budget for risky loans.');
      }
    });
  });

  describe('runtimeCast', () => {
    const correctRuntimeCastInputs: any[] = [
      {
        _id: 'xxx',
        name: 'Budget 1',
        description: 'Budget for risky loans.',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        },
        calculatedTotalAmount: 0,
        calculatedLendedAmount: 0,
      },
      {
        _id: 'xxx',
        name: 'Super budget ',
        description: 'Budget for friends',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'WEEK',
          amount: 0,
          entryTimestamp: 1663055253,
          revisions: [],
        },
        calculatedTotalAmount: 0,
        calculatedLendedAmount: 0,
      },
      {
        _id: 'xxx',
        name: 'Other',
        description: 'Budget for other loans.',
        defaultInterestRate: {
          type: 'FIXED_PER_DURATION',
          duration: 'FULL_DURATION',
          amount: 2,
          entryTimestamp: 1663012853,
          revisions: [],
        },
        calculatedTotalAmount: 0,
        calculatedLendedAmount: 0,
      },
    ];

    test.each(correctRuntimeCastInputs)('It works with correct input', (input) => {
      const result = budgetHelpers.runtimeCast(input);
      expect(result).toEqual(input);
    });

    const invalidRuntimeCastInputs: any[] = [
      {
        _id: 'xxx',
        // Name is missing from object
        description: 'Budget for risky loans.',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        },
        calculatedTotalAmount: 0,
        calculatedLendedAmount: 0,
      },
      {
        // Name is undefined
        _id: 'xxx',
        name: undefined,
        description: 'Budget for risky loans.',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        },
        calculatedTotalAmount: 0,
        calculatedLendedAmount: 0,
      },
      {
        // Name is null
        _id: 'xxx',
        name: null,
        description: 'Budget for risky loans.',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        },
        calculatedTotalAmount: 0,
        calculatedLendedAmount: 0,
      },
      {
        // Name is object
        _id: 'xxx',
        name: new Object(),
        description: 'Budget for risky loans.',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        },
        calculatedTotalAmount: 0,
        calculatedLendedAmount: 0,
      },
      {
        // Description is missing from object
        _id: 'xxx',
        name: 'Budget one',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        },
        calculatedTotalAmount: 0,
        calculatedLendedAmount: 0,
      },
      {
        // Description is undefined
        _id: 'xxx',
        name: 'Budget one',
        description: undefined,
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        },
        calculatedTotalAmount: 0,
        calculatedLendedAmount: 0,
      },
      {
        // Description is null
        _id: 'xxx',
        name: 'Budget one',
        description: null,
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        },
        calculatedTotalAmount: 0,
        calculatedLendedAmount: 0,
      },
      {
        // defaultInterestRate is missing from object
        _id: 'xxx',
        name: 'Budget one',
        description: 'My best budget.',
        calculatedTotalAmount: 0,
        calculatedLendedAmount: 0,
      },
      {
        // defaultInterestRate is string
        _id: 'xxx',
        name: 'Budget one',
        description: 'My best budget.',
        defaultInterestRate: '10% per year',
        calculatedTotalAmount: 0,
        calculatedLendedAmount: 0,
      },
      {
        // defaultInterestRate.duration is NaN
        _id: 'xxx',
        name: 'Budget one',
        description: 'My best budget.',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: NaN,
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        },
        calculatedTotalAmount: 0,
        calculatedLendedAmount: 0,
      },
      {
        // defaultInterestRate.duration is NaN
        _id: 'xxx',
        name: 'Budget one',
        description: 'My best budget.',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: "'WEEK",
          amount: 5,
          entryTimestamp: NaN,
          revisions: [],
        },
        calculatedTotalAmount: 0,
        calculatedLendedAmount: 0,
      },
      {
        // calculatedTotalAmount is NaN
        _id: 'xxx',
        name: 'Budget one',
        description: 'My best budget.',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        },
        calculatedTotalAmount: NaN,
        calculatedLendedAmount: 0,
      },
      {
        // calculatedLendedAmount is false
        _id: 'xxx',
        name: 'Budget one',
        description: 'My best budget.',
        defaultInterestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: [],
        },
        calculatedTotalAmount: 10,
        calculatedLendedAmount: false,
      },
    ];

    test.each(invalidRuntimeCastInputs)('It throws error if input is invalid', (input) => {
      expect(() => {
        budgetHelpers.runtimeCast(input);
      }).toThrow();
    });
  });
});
