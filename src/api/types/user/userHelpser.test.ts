import { userHelpers, userRegistrationInfoHelpers, userUpdateInfoHelpers } from './userHelpers.js';

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
  describe('validate', () => {
    test('It works with perfect input', () => {
      const input = {
        name: 'Gregor',
        email: 'gregor@test.com',
        currency: 'EUR',
        language: 'sl-SI',
        password: 'Not validated here',
      };
      const result = userRegistrationInfoHelpers.validateUserRegistrationInfo(input);

      // Check if it does not modify original object
      expect(input.name).toBe('Gregor');
      expect(input.email).toBe('gregor@test.com');
      expect(input.currency).toBe('EUR');
      expect(input.language).toBe('sl-SI');

      // Check if result is same as input
      expect(result.name).toBe(input.name);
      expect(result.email).toBe(input.email);
      expect(result.currency).toBe(input.currency);
      expect(result.language).toBe(input.language);
    });

    test('It throws error if name is empty string', () => {
      const input = {
        name: '',
        email: 'gregor@test.com',
        currency: 'EUR',
        language: 'sl-SI',
        password: 'Not validated here',
      };

      expect(() => {
        userRegistrationInfoHelpers.validateUserRegistrationInfo(input);
      }).toThrow();
    });

    test('It throws error if email is not in email format', () => {
      const input = {
        name: 'Gregor',
        email: 'gregortest.com',
        currency: 'EUR',
        language: 'sl-SI',
        password: 'Not validated here',
      };

      expect(() => {
        userRegistrationInfoHelpers.validateUserRegistrationInfo(input);
      }).toThrow();
    });

    test('It throws error if currency does not exist', () => {
      expect(() => {
        userRegistrationInfoHelpers.validateUserRegistrationInfo({
          name: 'Gregor',
          email: 'gregor@test.com',
          currency: 'jin',
          language: 'sl-SI',
          password: 'Not validated here',
        });
      }).toThrow();
      expect(() => {
        userRegistrationInfoHelpers.validateUserRegistrationInfo({
          name: 'Gregor',
          email: 'gregor@test.com',
          currency: 'euro',
          language: 'sl-SI',
          password: 'Not validated here',
        });
      }).toThrow();

      expect(() => {
        userRegistrationInfoHelpers.validateUserRegistrationInfo({
          name: 'Gregor',
          email: 'gregor@test.com',
          currency: 'US_Dollar',
          language: 'sl-SI',
          password: 'Not validated here',
        });
      }).toThrow();
      expect(() => {
        userRegistrationInfoHelpers.validateUserRegistrationInfo({
          name: 'Gregor',
          email: 'gregor@test.com',
          currency: '',
          language: 'sl-SI',
          password: 'Not validated here',
        });
      }).toThrow();
    });

    test('It throws error if language is non existant locale', () => {
      expect(() => {
        userRegistrationInfoHelpers.validateUserRegistrationInfo({
          name: 'Gregor',
          email: 'gregor@test.com',
          currency: 'EUR',
          language: 'siSL',
          password: 'Not validated here',
        });
      }).toThrow();

      expect(() => {
        userRegistrationInfoHelpers.validateUserRegistrationInfo({
          name: 'Gregor',
          email: 'gregor@test.com',
          currency: 'EUR',
          language: 'si',
          password: 'Not validated here',
        });
      }).toThrow();

      expect(() => {
        userRegistrationInfoHelpers.validateUserRegistrationInfo({
          name: 'Gregor',
          email: 'gregor@test.com',
          currency: 'EUR',
          language: 'si-sl',
          password: 'Not validated here',
        });
      }).toThrow();
    });
  });

  describe('sanitize', () => {
    test('It sanitizes input fields', () => {
      const input = {
        name: '  Gregor  ',
        email: 'gregOr@TEst.com ',
        currency: 'EUR ',
        language: ' sl-SI',
        password: 'Not validated here',
      };
      userRegistrationInfoHelpers.sanitizeUserRegistrationInfo(input);
      expect(input.name).toBe('Gregor');
      expect(input.email).toBe('gregor@test.com');
      expect(input.currency).toBe('EUR');
      expect(input.language).toBe('sl-SI');
    });
  });

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
