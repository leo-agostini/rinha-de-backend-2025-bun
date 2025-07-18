export type EvalOptions = {
  keys: string[];
  arguments?: (string | number)[];
};

export default interface Cache<TSet = any, TGet = any> {
  get(key: string): Promise<TGet>;
  set(key: string, value: TSet): Promise<void>;
  inc(key: string): Promise<void>;
  add(key: string, value: { score: number; value: any }[]): Promise<void>;
  eval(script: string, options?: EvalOptions): Promise<any>;
  connect(): Promise<void>;
}
