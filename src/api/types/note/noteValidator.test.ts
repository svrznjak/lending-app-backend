import { validateNote } from './noteValidator.js';

describe('validateNote', () => {
  describe('isValidContent', () => {
    test('It returns true if string is just right.', () => {
      expect(
        validateNote.isValidContent(`This is
      a new
      note!`),
      ).toBe(true);
      expect(validateNote.isValidContent(`This is a new note.`)).toBe(true);
    });
    test('It returns false if string is empty.', () => {
      expect(validateNote.isValidContent('')).toBe(false);
    });
  });
  describe('isValidCreatedAtTimestamp', () => {
    test('It returns true if interest amount is just right.', () => {
      expect(validateNote.isValidCreatedAtTimestamp(1)).toBe(true);
      expect(validateNote.isValidCreatedAtTimestamp(300000)).toBe(true);
      expect(validateNote.isValidCreatedAtTimestamp(12312358709)).toBe(true);
      expect(validateNote.isValidCreatedAtTimestamp(123e-3)).toBe(true);
      expect(validateNote.isValidCreatedAtTimestamp(0x11)).toBe(true);
    });
    test('It returns false if interest amount is of wrong value.', () => {
      expect(validateNote.isValidCreatedAtTimestamp(NaN)).toBe(false);
      expect(validateNote.isValidCreatedAtTimestamp(Infinity)).toBe(false);
      expect(validateNote.isValidCreatedAtTimestamp(null)).toBe(false);
      expect(validateNote.isValidCreatedAtTimestamp(undefined)).toBe(false);
      expect(validateNote.isValidCreatedAtTimestamp(50000000000000000)).toBe(false);
    });

    test('It returns false if interest amount is negative.', () => {
      expect(validateNote.isValidCreatedAtTimestamp(-1)).toBe(false);
      expect(validateNote.isValidCreatedAtTimestamp(-123e-3)).toBe(false);
      expect(validateNote.isValidCreatedAtTimestamp(-0x11)).toBe(false);
    });
  });
});
