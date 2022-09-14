import { isValidText, isValidTimestamp } from '../../utils/inputValidator/inputValidator.js';

export const validateNote = {
  isValidContent: function isValidContent(content: string): boolean {
    return isValidText({
      text: content,
      validEmpty: false,
      maxLength: 2000,
    });
  },
  isValidCreatedAtTimestamp: function isValidCreatedAtTimestamp(createdAtTimestamp: number): boolean {
    return isValidTimestamp({ timestamp: createdAtTimestamp });
  },
};
