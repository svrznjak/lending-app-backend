import { isValidOption } from '../../utils/inputValidator/inputValidator.js';

export default {
  isValidRevenueCatId: function isValidRevenueCatId(revenuecatId: string): boolean {
    // TODO
    if (revenuecatId.length > 50) return false;
    return true;
  },
  isValidType: function isValidType(type: string): boolean {
    return isValidOption({
      option: type,
      validOptions: ['FREE', 'STANDARD', 'PREMIUM'],
      caseSensitive: true,
    });
  },
};
