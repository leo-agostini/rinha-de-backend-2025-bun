import Redis, { RedisClientType } from "redis";
import config from "../../config";
import Cache from "../../types/cache";

export default class RedisAdapter implements Cache {
  private redis: RedisClientType;

  constructor() {
    this.redis = Redis.createClient({
      url: config.redis.url,
      database: config.redis.db,
    });
  }

  async set(key: string, value: any): Promise<void> {
    await this.redis.set(key, value);
  }

  async get(key: string): Promise<any> {
    return await this.redis.get(key);
  }

  async inc(key: string): Promise<void> {
    await this.redis.incr(key);
  }

  async connect() {
    await this.redis.connect();
  }

  async eval(
    script: string,
    options: { keys: string[]; arguments: string[] }
  ): Promise<any> {
    return this.redis.eval(script, options);
  }

  async lPush(key: string, value: string) {
    return this.redis.rPush(key, value);
  }

  async lRange(key, start, stop) {
    return this.redis.lRange(key, start, stop);
  }

  async lTrim(key, start, stop) {
    return this.redis.lTrim(key, start, stop);
  }

  async pop(key: string) {
    return this.redis.rPop(key);
  }
}
