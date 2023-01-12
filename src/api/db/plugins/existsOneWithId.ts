import { ClientSession } from 'mongoose';

export default async function existsOneWithId(id: string, session?: ClientSession): Promise<boolean> {
  const result = await this.findById(id).select('_id').session(session).lean();
  return result ? true : false;
}
