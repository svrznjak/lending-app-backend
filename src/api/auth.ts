import { getAuth } from 'firebase-admin/auth';

const createNewUserWithEmail = async function createNewAuthUserWithEmail(
  email: string,
  password: string,
): Promise<string> {
  const newFirebaseUser = await getAuth().createUser({
    email: email,
    emailVerified: false,
    password: password,
    disabled: false,
  });
  return newFirebaseUser.uid;
};

const getAuthIdFromAuthHeader = async function getAuthIdFromAuthHeader(authorizationHeader): Promise<string> {
  return (await getAuth().verifyIdToken(authorizationHeader || '')).user_id;
};

const deleteUserByAuthId = async function deleteUserByAuthId(userId): Promise<void> {
  return await getAuth().deleteUser(userId);
};

export default {
  createNewUserWithEmail,
  getAuthIdFromAuthHeader,
  deleteUserByAuthId,
};
