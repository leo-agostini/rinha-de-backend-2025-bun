import { RedisClient } from "bun";
import Cache from "../types/cache";

export default class RedisAdapter implements Cache {
  private redis: RedisClient;

  constructor() {
    this.redis = new RedisClient();
  }

  async set(key: string, value: any): Promise<void> {
    await this.redis.set(key, value);
  }

  async get(key: string): Promise<any> {
    return await this.redis.get(key);
  }

  async inc(key: string): Promise<void> {
    return await this.inc(key);
  }
}
