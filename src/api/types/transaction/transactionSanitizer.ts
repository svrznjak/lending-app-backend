import validator from 'validator';

export const sanitizeTransaction = {
  description: function sanitizeDescription(description: string): string {
    description = validator.trim(description);
    description = validator.escape(description);
    return description;
  },
};
