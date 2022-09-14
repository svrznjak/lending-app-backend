import validator from 'validator';

export const sanitizeNote = {
  content: function sanitizeNoteContent(content: string): string {
    content = validator.trim(content);
    content = validator.escape(content);
    return content;
  },
};
