export default interface Cache<TSet = any, TGet = any> {
  get(key: string): Promise<TGet>;
  set(key: string, value: TSet): Promise<void>;
}
