export interface INote {
  _id: object;
  content: string;
  createdAtTimestamp: number;
  revisions: [INote?];
}
