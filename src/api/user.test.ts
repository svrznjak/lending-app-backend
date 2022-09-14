import { getUserById } from './user.js';
import UserModel from './db/model/UserModel.js';
import { IUser } from './types/user/userInterface.js';

jest.mock('./db/model/UserModel.js');
const mockedUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe('getUserById', () => {
  test('It returns a user if user is found.', async () => {
    const fakeUser = {
      _id: 'Fake_Id_Object',
      name: 'Name',
      email: 'gregor@svrznjak.com',
      authId: '0030020014kfdslmf1',
      budgets: [],
      loans: [],
      currency: 'eur',
      language: 'si_SL',
      subscription: {
        type: 'FREE',
        revenuecatId: '',
      },
      toObject: function () {
        const { toObject, ...rest } = this;
        return rest;
      },
    };
    mockedUserModel.findOne.mockResolvedValue(fakeUser);

    const user: IUser = await getUserById('UserID_Fake');
    expect(user).toEqual(fakeUser.toObject());
  });

  test('It fails if user data is corrupted.', async () => {
    mockedUserModel.findOne.mockResolvedValue({
      _id: new Object('Fake_Id_Object'),
      name: 'Name',
      email: 'gregor@svrznjak.com',
      authId: '0030020014kfdslmf1',
      budgets: [],
      loans: [],
      currency: null,
      language: 'si_SL',
      subscription: {
        type: 'FREE',
        revenuecatId: '',
      },
    });

    let failed = false;

    try {
      await getUserById('UserID_Fake');
    } catch (err) {
      console.log(err);
      failed = true;
    }
    expect(failed).toEqual(true);
  });

  test('It returns undefined if user does not exist.', async () => {
    mockedUserModel.findOne.mockResolvedValue(null);

    expect(await getUserById('nonexistantid')).toEqual(undefined);
  });
});
