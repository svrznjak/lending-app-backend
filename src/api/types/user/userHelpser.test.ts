import { userHelpers, userUpdateInfoHelpers } from './userHelpers.js';

describe('userHelpers', () => {
  describe('validate', () => {
    // Validate is currently not implemented on userHelpers, because this helper is currently only used as output from database.
  });
  describe('sanitize', () => {
    // Sanitize is currently not implemented on userHelpers, because this helper is currently only used as output from database.
  });
  describe('runtimeCast', () => {
    test('It works with perfect input', () => {
      const input = {
        _id: 'xxx',
        name: 'My name',
        email: 'string@gmail.com',
        authId: 'cccxxx',
        budgets: [],
        loans: [],
        currency: 'EUR',
        language: 'sl-SI',
        subscription: {
          type: 'FREE',
          revenuecatId: '',
        },
      };
      const result = userHelpers.runtimeCast(input);

      expect(result).toEqual(input);
    });
    test('It throws error if there is required field missing', () => {
      expect(() => {
        userHelpers.runtimeCast({
          _id: 'xxx',
          name: 'My name',
          email: 'string@gmail.com',
        });
      }).toThrow();
      expect(() => {
        userHelpers.runtimeCast({
          name: 'My name',
          email: 'string@gmail.com',
          authId: 'cccxxx',
          budgets: [],
          loans: [],
          currency: 'EUR',
          language: 'sl-SI',
          subscription: {
            type: 'FREE',
            revenuecatId: '',
          },
        });
      }).toThrow();
      expect(() => {
        userHelpers.runtimeCast({
          _id: 'xxx',
          name: 'My name',
          email: 'string@gmail.com',
          authId: 'cccxxx',
          budgets: [],
          currency: 'EUR',
          language: 'sl-SI',
          subscription: {
            type: 'FREE',
            revenuecatId: '',
          },
        });
      }).toThrow();
      expect(() => {
        userHelpers.runtimeCast({
          _id: 'xxx',
          name: 'My name',
          email: 'string@gmail.com',
          authId: 'cccxxx',
          budgets: [],
          loans: [],
          currency: 'EUR',
          language: 'sl-SI',
          subscription: {
            type: 'FREE',
          },
        });
      }).toThrow();
      expect(() => {
        userHelpers.runtimeCast({
          _id: 'xxx',
          name: 'My name',
          email: 'string@gmail.com',
          authId: 'cccxxx',
          budgets: [],
          loans: [],
          currency: 'EUR',
          language: 'sl-SI',
        });
      }).toThrow();
      expect(() => {
        userHelpers.runtimeCast({});
      }).toThrow();
    });
    test('It throws error if field has wrong type', () => {
      expect(() => {
        userHelpers.runtimeCast({
          _id: false,
          name: 'My name',
          email: 'string@gmail.com',
          authId: 'cccxxx',
          budgets: [],
          loans: [],
          currency: 'EUR',
          language: 'sl-SI',
          subscription: {
            type: 'FREE',
            revenuecatId: '',
          },
        });
      }).toThrow();

      expect(() => {
        userHelpers.runtimeCast({
          _id: 'xxx',
          name: 'My name',
          email: 'string@gmail.com',
          authId: 'cccxxx',
          budgets: true,
          loans: [],
          currency: 'EUR',
          language: 'sl-SI',
          subscription: {
            type: 'FREE',
            revenuecatId: '',
          },
        });
      }).toThrow();

      expect(() => {
        userHelpers.runtimeCast({
          _id: 'xxx',
          name: 'My name',
          email: 'string@gmail.com',
          authId: 'cccxxx',
          budgets: 'Array',
          loans: [],
          currency: 'EUR',
          language: 'sl-SI',
          subscription: {
            type: 'FREE',
            revenuecatId: '',
          },
        });
      }).toThrow();

      expect(() => {
        userHelpers.runtimeCast({
          _id: 'xxx',
          name: 'My name',
          email: 'string@gmail.com',
          authId: 'cccxxx',
          budgets: {},
          loans: [],
          currency: 'EUR',
          language: 'sl-SI',
          subscription: {
            type: 'FREE',
            revenuecatId: '',
          },
        });
      }).toThrow();
    });
  });
});
describe('userRegistrationInfoHelpers', () => {
  describe('runtimeCast', () => {
    // TODO
  });
});

describe('userUpdateInfoHelpers', () => {
  describe('validate', () => {
    test('It works with no update fields entered', () => {
      const input = {};
      const result = userUpdateInfoHelpers.validateUserUpdateInfo(input);

      expect(result.name).toBe(undefined);
      expect(result.currency).toBe(undefined);
      expect(result.language).toBe(undefined);
    });
    test('It works with one update fields entered', () => {
      const result1 = userUpdateInfoHelpers.validateUserUpdateInfo({ name: 'New name' });

      expect(result1.name).toBe('New name');
      expect(result1.currency).toBe(undefined);
      expect(result1.language).toBe(undefined);

      const result2 = userUpdateInfoHelpers.validateUserUpdateInfo({ currency: 'EUR' });

      expect(result2.name).toBe(undefined);
      expect(result2.currency).toBe('EUR');
      expect(result2.language).toBe(undefined);

      const result3 = userUpdateInfoHelpers.validateUserUpdateInfo({ language: 'sl-SI' });

      expect(result3.name).toBe(undefined);
      expect(result3.currency).toBe(undefined);
      expect(result3.language).toBe('sl-SI');
    });

    test('It throws error if only one update field is entered and it is invalid', () => {
      expect(() => {
        userUpdateInfoHelpers.validateUserUpdateInfo({ name: '' });
      }).toThrow();

      expect(() => {
        userUpdateInfoHelpers.validateUserUpdateInfo({ currency: 'EURO' });
      }).toThrow();

      expect(() => {
        userUpdateInfoHelpers.validateUserUpdateInfo({ language: 'Slovenian' });
      }).toThrow();
    });

    test('It throws error if twi update fields are entered and one is invalid', () => {
      expect(() => {
        userUpdateInfoHelpers.validateUserUpdateInfo({ name: '', currency: 'EUR' });
      }).toThrow();
      expect(() => {
        userUpdateInfoHelpers.validateUserUpdateInfo({ name: 'Gregor', currency: 'EURO' });
      }).toThrow();
      expect(() => {
        userUpdateInfoHelpers.validateUserUpdateInfo({ language: 'Slovenian', currency: 'EUR' });
      }).toThrow();
    });

    test('It works with all fields entered', () => {
      const result = userUpdateInfoHelpers.validateUserUpdateInfo({
        name: 'New name',
        currency: 'EUR',
        language: 'sl-SI',
      });

      expect(result.name).toBe('New name');
      expect(result.currency).toBe('EUR');
      expect(result.language).toBe('sl-SI');
    });

    test('It throws error if all fields are entered and only one is incorrect', () => {
      expect(() => {
        userUpdateInfoHelpers.validateUserUpdateInfo({ name: 'Gregor', currency: 'EUR', language: ' slovenian' });
      }).toThrow();
      expect(() => {
        userUpdateInfoHelpers.validateUserUpdateInfo({ language: 'sl-SI', name: 'Gregor', currency: 'EURo' });
      }).toThrow();
    });
  });
  describe('sanitize', () => {
    test('It works with perfect input', () => {
      const userUpdate = {
        name: 'Gregor',
        currency: 'EUR',
        language: 'sl-SI',
      };
      userUpdateInfoHelpers.sanitizeUserUpdateInfo(userUpdate);
      expect(userUpdate.name).toBe('Gregor');
      expect(userUpdate.currency).toBe('EUR');
      expect(userUpdate.language).toBe('sl-SI');
    });

    test('It works if only one field is passed', () => {
      const userUpdate = {
        name: 'Gregor',
      };
      userUpdateInfoHelpers.sanitizeUserUpdateInfo(userUpdate);
      expect(userUpdate.name).toBe('Gregor');
    });

    test('It works if only two fields are passed', () => {
      const userUpdate = {
        name: 'Gregor',
        language: 'sl-SI',
      };
      userUpdateInfoHelpers.sanitizeUserUpdateInfo(userUpdate);
      expect(userUpdate.name).toBe('Gregor');
      expect(userUpdate.language).toBe('sl-SI');
    });
  });

  describe('runtimeCast', () => {
    test('It works with perfect input', () => {
      const userUpdate = {
        name: 'Gregor',
        currency: 'eur',
        language: 'sl-SI',
      };
      userUpdateInfoHelpers.runtimeCast(userUpdate);
      expect(userUpdate.name).toBe('Gregor');
      expect(userUpdate.currency).toBe('eur');
      expect(userUpdate.language).toBe('sl-SI');
    });
    test('It works with only one field passed', () => {
      const userUpdate = {
        name: 'Gregor',
      };
      userUpdateInfoHelpers.runtimeCast(userUpdate);
      expect(userUpdate.name).toBe('Gregor');
    });
    test('It works with only two field passed', () => {
      const userUpdate = {
        name: 'Gregor',
        language: 'sl-SI',
      };
      userUpdateInfoHelpers.runtimeCast(userUpdate);
      expect(userUpdate.name).toBe('Gregor');
      expect(userUpdate.language).toBe('sl-SI');
    });
  });
});
