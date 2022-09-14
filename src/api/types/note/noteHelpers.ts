import _ from 'lodash';
import { INote } from './noteInterface.js';
import { validateNote } from './noteValidator.js';
import { sanitizeNote } from './noteSanitizer.js';

export const noteHelpers = {
  validate: function validate(
    note: Pick<INote, 'content' | 'createdAtTimestamp'>,
  ): Pick<INote, 'content' | 'createdAtTimestamp'> {
    if (!validateNote.isValidContent(note.content)) throw new Error('(validation) note.content is invalid!');
    if (!validateNote.isValidCreatedAtTimestamp(note.createdAtTimestamp))
      throw new Error('(validation) note.createdAtTimestamp is invalid!');

    return note;
  },

  sanitize: function sanitize(note: INote): void {
    note.content = sanitizeNote.content(note.content);
  },

  runtimeCast: function runtimeCast(note: any): INote {
    if (typeof this !== 'object' || this === null) throw new Error('Type of note must be an object!');
    if (!_.isString(note._id)) throw new Error('Type of note._id must be a string!');
    if (!_.isString(note.content)) throw new Error('Type of note.content must be a string!');
    if (!Number.isFinite(note.createdAtTimestamp)) throw new Error('Type of note.createdAtTimestamp must be a number!');
    if (!Array.isArray(note.revisions)) throw new Error('Type of note.revisions must be an array!');

    return {
      _id: note._id,
      content: note.content,
      createdAtTimestamp: note.createdAtTimestamp,
      revisions: note.revisions,
    };
  },
};
