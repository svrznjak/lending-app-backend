import { sanitizeText } from './../../utils/inputSanitizer/inputSanitizer.js';
import _ from 'lodash';
import { INote } from './noteInterface.js';
import { isValidText, isValidTimestamp } from '../../utils/inputValidator/inputValidator.js';

export const noteHelpers = {
  validate: {
    all: function validateAll(note: INote): INote {
      this.content(note.content);
      this.entryTimestamp(note.entryTimestamp);
      return note;
    },
    content: function validateContent(content: string): string {
      if (
        !isValidText({
          text: content,
          validEmpty: false,
          maxLength: 2000,
        })
      )
        throw new Error('(validation) content is invalid!');
      return content;
    },
    entryTimestamp: function validateEntryTimestamp(entryTimestamp: number): number {
      if (!isValidTimestamp({ timestamp: entryTimestamp })) throw new Error('(validation) entryTimestamp is invalid!');
      return entryTimestamp;
    },
  },

  sanitize: {
    all: function sanitizeAll(note: INote): void {
      note.content = this.content(note.content);
    },
    content: function sanitizeContent(content): string {
      return sanitizeText({ text: content });
    },
  },

  runtimeCast: function runtimeCast(note: any): INote {
    if (typeof this !== 'object' || this === null) throw new Error('Type of note must be an object!');
    if (!_.isString(note._id)) throw new Error('Type of note._id must be a string!');
    if (!_.isString(note.content)) throw new Error('Type of note.content must be a string!');
    if (!Number.isFinite(note.entryTimestamp)) throw new Error('Type of note.entryTimestamp must be a number!');
    if (!Array.isArray(note.revisions)) throw new Error('Type of note.revisions must be an array!');

    return {
      _id: note._id,
      content: note.content,
      entryTimestamp: note.entryTimestamp,
      revisions: note.revisions,
    };
  },
};
