export default async function existsOneWithId(id: string): Promise<boolean> {
  const result = await this.findById(id).select('_id').lean();
  return result ? true : false;
}
