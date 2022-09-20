export interface INote {
  _id: object;
  content: string;
  entryTimestamp: number;
  revisions?: INote;
}
