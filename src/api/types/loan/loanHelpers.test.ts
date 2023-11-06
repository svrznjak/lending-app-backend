/* eslint-disable jest/no-commented-out-tests */
import { loanHelpers } from './loanHelpers.js';
import { ILoan } from './loanInterface.js';

describe('loanHelpers', () => {
  describe('validate', () => {
    const correctValidationInputs: Pick<
      ILoan,
      'name' | 'description' | 'openedTimestamp' | 'closesTimestamp' | 'interestRate' | 'paymentFrequency'
    >[] = [
      {
        name: 'Loan 1',
        description: 'Car loan.',
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        name: 'Loan 2',
        description: '',
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'FIXED_PER_DURATION',
          duration: 'FULL_DURATION',
          amount: 4,
          entryTimestamp: 1663012853,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
    ];
    test.each(correctValidationInputs)('It works with correct input', (input) => {
      const result = loanHelpers.validate.all(input);
      expect(result).toEqual(input);
    });

    const invalidValidationInputs: Pick<
      ILoan,
      'name' | 'description' | 'openedTimestamp' | 'closesTimestamp' | 'interestRate' | 'paymentFrequency'
    >[] = [
      {
        // To short name
        name: '',
        description: 'Car loan.',
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        // name is undefined
        name: undefined,
        description: 'Car loan.',
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        //To long name
        name: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.',
        description: 'Car loan.',
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        // To long description
        name: 'Loan 1',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus facilisis lorem eu aliquet. Suspendisse imperdiet laoreet condimentum.',
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        // description is undefined
        name: 'Loan 1',
        description: undefined,
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        // openedTimestamp and closesTimestamp is negative (check if validation is called)
        name: 'Loan 1',
        description: 'Car loan.',
        openedTimestamp: -1,
        closesTimestamp: -1,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        // openedTimestamp and closesTimestamp is NaN (check if validation is called)
        name: 'Loan 1',
        description: 'Car loan.',
        openedTimestamp: NaN,
        closesTimestamp: NaN,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        // openedTimestamp and closesTimestamp is undefined (check if validation is called)
        name: 'Loan 1',
        description: 'Car loan.',
        openedTimestamp: undefined,
        closesTimestamp: undefined,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        name: 'Loan 1',
        description: 'Car loan.',
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        // initialPrinciple is NaN
        name: 'Loan 1',
        description: 'Car loan.',
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        // initialPrinciple is undefined
        name: 'Loan 1',
        description: 'Car loan.',
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        // interestRate.amount is negative
        name: 'Loan 1',
        description: 'Car loan.',
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: -1,
          entryTimestamp: 1663012853,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        // interestRate.amount is NaN
        name: 'Loan 1',
        description: 'Car loan.',
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: NaN,
          entryTimestamp: 1663012853,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        // interestRate.amount is Infinity
        name: 'Loan 1',
        description: 'Car loan.',
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: Infinity,
          entryTimestamp: 1663012853,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        // interestRate.entryTimestamp is negative
        name: 'Loan 1',
        description: 'Car loan.',
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: -1,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        // interestRate.entryTimestamp is Intinity
        name: 'Loan 1',
        description: 'Car loan.',
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: Infinity,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
      {
        //interestRate.entryTimestamp in null
        name: 'Loan 1',
        description: 'Car loan.',
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: null,
          revisions: undefined,
          isCompounding: false,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
      },
    ];
    test.each(invalidValidationInputs)('It throws error if input is invalid', (input) => {
      expect(() => {
        loanHelpers.validate.all(input);
      }).toThrow();
    });
  });

  describe('sanitize', () => {
    test('It works with correct input', () => {
      {
        // Name and description get trimmed (check if sanitize is called)
        const input = {
          _id: 'xxx',
          userId: 'xxx',
          name: '  Loan 1   ',
          description: '   Car loan. ',
          notes: [],
          openedTimestamp: 1663012800,
          closesTimestamp: 1753012802,
          interestRate: {
            type: 'PERCENTAGE_PER_DURATION',
            duration: 'MONTH',
            amount: 5,
            entryTimestamp: 1663012853,
            revisions: undefined,
            isCompounding: false,
          },
          status: {
            current: 'ACTIVE',
            timestamp: 1663012853,
          },
        } as ILoan;
        loanHelpers.sanitize.all(input);
        expect(input.name).toBe('Loan 1');
        expect(input.description).toBe('Car loan.');
      }
    });
  });

  describe('runtimeCast', () => {
    const correctRuntimeCastInputs: any[] = [
      {
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        _id: 'xxlkdsajfi323lix',
        name: 'Loan 2',
        description: '',
        notes: [],
        openedTimestamp: 1663033800,
        closesTimestamp: 1753099802,
        interestRate: {
          type: 'FIXED_PER_DURATION',
          duration: 'FULL_DURATION',
          amount: 15,
          entryTimestamp: 1663212853,
          revisions: undefined,
        },
        paymentFrequency: {
          occurrence: 'MONTHLY',
          isStrict: true,
          strictValue: '1',
          entryTimestamp: 1663012853,
        },
        calculatedTotalPaidPrincipal: 0,
        calculatedOutstandingInterest: 10,
        calculatedPaidInterest: 5,
      },
    ];

    test.each(correctRuntimeCastInputs)('It works with correct input', (input) => {
      const result = loanHelpers.runtimeCast(input);
      expect(result).toEqual(input);
    });

    const invalidRuntimeCastInputs: any[] = [
      {
        // Name is missing
        _id: 'xxx',
        description: 'Car loan.',
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // Name is undefind
        _id: 'xxx',
        name: undefined,
        description: 'Car loan.',
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // Name is null
        _id: 'xxx',
        name: null,
        description: 'Car loan.',
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // Name is number
        _id: 'xxx',
        name: 2000,
        description: 'Car loan.',
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // Description is missing from object
        _id: 'xxx',
        name: 'Loan 1',
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // description is undefined
        _id: 'xxx',
        name: 'Loan 1',
        description: undefined,
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // description is number
        _id: 'xxx',
        name: 'Loan 1',
        description: 2002,
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // description is null
        _id: 'xxx',
        name: 'Loan 1',
        description: null,
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // notes is missing
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // notes is undefined
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        notes: undefined,
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // notes is number
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        notes: 2.2,
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // opened timestamp is string
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        notes: [],
        openedTimestamp: '1663012800',
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        //closesTimestamp is string
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: '1753012802',
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        //openedTimestamp is missing
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        notes: [],
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // closesTimestamp is missing
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        notes: [],
        openedTimestamp: 1663012800,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        //Initial principle is NaN
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // interestRate is missing
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // interestRate.amount is NaN
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: NaN,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // calculatedTotalPaidPrincipal is missing
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // calculatedTotalPaidPrincipal is NaN
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: NaN,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: 50,
      },
      {
        // calculatedOutstandingInterest is missing
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedPaidInterest: 50,
      },
      {
        //calculatedOutstandingInterest is NaN
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: NaN,
        calculatedPaidInterest: 50,
      },
      {
        // calculaterPaidInterest is missing
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
      },
      {
        // calculatedPaidInterest is NaN
        _id: 'xxx',
        name: 'Loan 1',
        description: 'Car loan.',
        notes: [],
        openedTimestamp: 1663012800,
        closesTimestamp: 1753012802,
        interestRate: {
          type: 'PERCENTAGE_PER_DURATION',
          duration: 'MONTH',
          amount: 5,
          entryTimestamp: 1663012853,
          revisions: undefined,
        },
        calculatedTotalPaidPrincipal: 100,
        calculatedOutstandingInterest: 50,
        calculatedPaidInterest: NaN,
      },
    ];

    test.each(invalidRuntimeCastInputs)('It throws error if input is invalid', (input) => {
      expect(() => {
        loanHelpers.runtimeCast(input);
      }).toThrow();
    });
  });
});
