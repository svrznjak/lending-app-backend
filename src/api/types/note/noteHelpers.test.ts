/* eslint-disable jest/no-commented-out-tests */
import { INote } from './noteInterface.js';
import { noteHelpers } from './noteHelpers.js';

describe('noteHelpers', () => {
  describe('validate', () => {
    const correctValidationInputs: Pick<INote, 'content' | 'createdAtTimestamp'>[] = [
      {
        content: `New note!`,
        createdAtTimestamp: 1663017539,
      },
      {
        content: `This is Perfect
        note!`,
        createdAtTimestamp: 1663019999,
      },
    ];
    test.each(correctValidationInputs)('It works with correct input', (input) => {
      const result = noteHelpers.validate(input);
      expect(result).toEqual(input);
    });

    const invalidValidationInputs: Pick<INote, 'content' | 'createdAtTimestamp'>[] = [
      {
        // content is undefined
        content: undefined,
        createdAtTimestamp: 1663019999,
      },
      {
        // createdAtTimestamp is negative
        content: `This is Perfect note!`,
        createdAtTimestamp: -1,
      },
      {
        // createdAtTimestamp is NaN
        content: `This is Perfect note!`,
        createdAtTimestamp: NaN,
      },
      {
        // createdAtTimestamp is undefined
        content: `This is Perfect note!`,
        createdAtTimestamp: undefined,
      },
      {
        // createdAtTimestamp is null
        content: `This is Perfect note!`,
        createdAtTimestamp: null,
      },
      {
        // createdAtTimestamp is to large
        content: `This is Perfect note!`,
        // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
        createdAtTimestamp: 9999999999999999999,
      },
    ];
    test.each(invalidValidationInputs)('It throws error if input is invalid', (input) => {
      expect(() => {
        noteHelpers.validate(input);
      }).toThrow();
    });
  });

  describe('sanitize', () => {
    test('It works with correct input', () => {
      {
        // Name and description get trimmed
        const input = {
          content: `This is Perfect
          note!`,
          createdAtTimestamp: 1663019999,
        } as INote;
        noteHelpers.sanitize(input);
        expect(input.content).toBe(`This is Perfect
          note!`);
        expect(input.createdAtTimestamp).toBe(1663019999);
      }
      {
        // Name and description get trimmed when only name and description are passed
        const input = {
          content: `    This is Perfect
          note!      `,
          createdAtTimestamp: 1663019999,
        } as INote;
        noteHelpers.sanitize(input);
        expect(input.content).toBe(`This is Perfect
          note!`);
        expect(input.createdAtTimestamp).toBe(1663019999);
      }
    });
  });

  describe('runtimeCast', () => {
    test('It works with perfect input', () => {
      const input = {
        _id: 'xxxxxxxxxasasd',
        content: `This is Perfect
          note!  `,
        createdAtTimestamp: 1663019999,
        revisions: [],
      };
      const result = noteHelpers.runtimeCast(input);

      // Check if it does not modify original object
      expect(input._id).toBe('xxxxxxxxxasasd');
      expect(input.content).toBe(`This is Perfect
          note!  `);
      expect(input.createdAtTimestamp).toBe(1663019999);
      expect(input.revisions).toEqual([]);

      // Check if result is same as input
      expect(result._id).toBe(input._id);
      expect(result.content).toBe(input.content);
      expect(result.createdAtTimestamp).toBe(input.createdAtTimestamp);
      expect(result.revisions).toEqual(input.revisions);
    });
    test('It throws error if input is not ok', () => {
      // _id is not present in input object
      expect(() => {
        noteHelpers.runtimeCast({
          content: `This is Perfect
          note!  `,
          createdAtTimestamp: 1663019999,
          revisions: [],
        });
      }).toThrow();
      // content is not present in input object
      expect(() => {
        noteHelpers.runtimeCast({
          _id: 'asdasdasfsadc',
          createdAtTimestamp: 1663019999,
          revisions: [],
        });
      }).toThrow();
      // createdAtTimestamp is not present in input object
      expect(() => {
        noteHelpers.runtimeCast({
          _id: 'asdasfacasfasd',
          content: `This is Perfect
          note!  `,
          revisions: [],
        });
      }).toThrow();
      // revisions is not present in input object
      expect(() => {
        noteHelpers.runtimeCast({
          _id: 'asdasfacasfasd',
          content: `This is Perfect
          note!  `,
          createdAtTimestamp: 1663019999,
        });
      }).toThrow();
      // _id is number
      expect(() => {
        noteHelpers.runtimeCast({
          _id: 123329052345,
          content: `This is Perfect
          note!  `,
          createdAtTimestamp: 1663019999,
          revisions: [],
        });
      }).toThrow();
      // _id is undefined
      expect(() => {
        noteHelpers.runtimeCast({
          _id: undefined,
          content: `This is Perfect
          note!  `,
          createdAtTimestamp: 1663019999,
          revisions: [],
        });
      }).toThrow();
      // _id is null
      expect(() => {
        noteHelpers.runtimeCast({
          _id: null,
          content: `This is Perfect
          note!  `,
          createdAtTimestamp: 1663019999,
          revisions: [],
        });
      }).toThrow();
      // content is undefined
      expect(() => {
        noteHelpers.runtimeCast({
          _id: 'xxxxxxxxxasasd',
          content: undefined,
          createdAtTimestamp: 1663019999,
          revisions: [],
        });
      }).toThrow();
      // content is null
      expect(() => {
        noteHelpers.runtimeCast({
          _id: 'xxxxxxxxxasasd',
          content: null,
          createdAtTimestamp: 1663019999,
          revisions: [],
        });
      }).toThrow();
      // content is number
      expect(() => {
        noteHelpers.runtimeCast({
          _id: 'xxxxxxxxxasasd',
          content: 10020,
          createdAtTimestamp: 1663019999,
          revisions: [],
        });
      }).toThrow();
      // content is number
      expect(() => {
        noteHelpers.runtimeCast({
          _id: 'xxxxxxxxxasasd',
          content: 10020,
          createdAtTimestamp: 1663019999,
          revisions: [],
        });
      }).toThrow();
      // content is true
      expect(() => {
        noteHelpers.runtimeCast({
          _id: 'xxxxxxxxxasasd',
          content: true,
          createdAtTimestamp: 1663019999,
          revisions: [],
        });
      }).toThrow();
      // createdAtTimestamp is string
      expect(() => {
        noteHelpers.runtimeCast({
          _id: 'xxxxxxacascasc12',
          content: `This is Perfect
          note!  `,
          createdAtTimestamp: '1663019999',
          revisions: [],
        });
      }).toThrow();
      // createdAtTimestamp is true
      expect(() => {
        noteHelpers.runtimeCast({
          _id: 'xxxxxxacascasc12',
          content: `This is Perfect
          note!  `,
          createdAtTimestamp: true,
          revisions: [],
        });
      }).toThrow();
      // createdAtTimestamp is undefined
      expect(() => {
        noteHelpers.runtimeCast({
          _id: 'xxxxxxacascasc12',
          content: `This is Perfect
          note!  `,
          createdAtTimestamp: undefined,
          revisions: [],
        });
      }).toThrow();
      // revisions is undefined
      expect(() => {
        noteHelpers.runtimeCast({
          _id: 'xxxxxxacascasc12',
          content: `This is Perfect
          note!  `,
          createdAtTimestamp: 1663019999,
          revisions: undefined,
        });
      }).toThrow();
      // revisions is null
      expect(() => {
        noteHelpers.runtimeCast({
          _id: 'xxxxxxacascasc12',
          content: `This is Perfect
          note!  `,
          createdAtTimestamp: 1663019999,
          revisions: null,
        });
      }).toThrow();
      // revisions is true
      expect(() => {
        noteHelpers.runtimeCast({
          _id: 'xxxxxxacascasc12',
          content: `This is Perfect
          note!  `,
          createdAtTimestamp: 1663019999,
          revisions: true,
        });
      }).toThrow();
    });
  });
});
