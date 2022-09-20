export interface INote {
  _id: string;
  content: string;
  entryTimestamp: number;
  revisions?: INote;
}
