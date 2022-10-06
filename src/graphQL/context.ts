import auth from '../api/auth.js';

export default async (req: any, _res: any): Promise<object> => {
  return {
    authHeader: req.headers.authorization || '',
    getCurrentUserAuthIdOrThrowValidationError: async (): Promise<string> => {
      try {
        return await auth.getAuthIdFromAuthHeader(req.headers.authorization || '');
      } catch (err) {
        throw new Error(
          'You must be logged in to access this query/mutation! Please provide correct HTTP Authorization header.',
        );
      }
    },
  };
};
