export type EvalOptions = {
  keys: string[];
  arguments?: (string | number)[];
};

export default interface Cache<TSet = any, TGet = any> {
  get(key: string): Promise<TGet>;
  set(key: string, value: TSet): Promise<void>;
  inc(key: string): Promise<void>;
  eval(script: string, options?: EvalOptions): Promise<any>;
  connect(): Promise<void>;
  lPush(key: string, value: string): Promise<number>;
  lRange(key: string, start: number, stop: number): Promise<string[]>;
  lTrim(key: string, start: number, stop: number): Promise<"OK">;
  pop(key: string): Promise<string | null>;
}
