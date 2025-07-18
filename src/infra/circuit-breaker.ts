import Cache from "../types/cache";
import { CircuitBreakerState } from "../types/circuit-breaker-state";

interface CircuitBreakerConfig {
  key: string;
  failureThreshold: number; // Number of failures before opening the circuit
  failureTimeout: number; // Time to wait before trying again
  storage: Cache;
}

export default class CircuitBreaker {
  private readonly key: string;
  private readonly failureThreshold: number; // Number of failures before opening the circuit
  private readonly failureTimeout: number; // Time to wait before trying again
  private readonly storage: Cache;

  private readonly storageFailureCountKey: string;
  private readonly storageStateKey: string;
  private readonly storageResetAfterKey: string;

  constructor({
    key,
    failureThreshold,
    failureTimeout,
    storage,
  }: CircuitBreakerConfig) {
    this.key = key;
    this.failureThreshold = failureThreshold;
    this.failureTimeout = failureTimeout;
    this.storage = storage;

    this.storageFailureCountKey = `${key}-failureCount`;
    this.storageStateKey = `${key}-state`;
    this.storageResetAfterKey = `${key}-resetAfter`;
  }

  async fire<R>(request: () => Promise<R>) {
    const fireScript = `
      local state = redis.call('GET', KEYS[1])
      local failureCount = redis.call('GET', KEYS[2])
      local resetAfter = redis.call('GET', KEYS[3])
      local isTimeToReset = tonumber(resetAfter) < tonumber(ARGV[1])

      if state == 'OPEN' and isTimeToReset == true then
        redis.call('SET', KEYS[1], 'HALF_OPEN')
      end
      
      return cjson.encode({
        isOpen = state == 'OPEN',
        isTimeToReset = isTimeToReset,
      })
    `;

    const result = await this.storage.eval(fireScript, {
      keys: [
        this.storageStateKey,
        this.storageFailureCountKey,
        this.storageResetAfterKey,
      ],
      arguments: [new Date().getTime().toString()],
    });

    const { isOpen, isTimeToReset } = JSON.parse(result);

    if (isOpen && !isTimeToReset) {
      throw new Error(`Circuit breaker is open - ${this.key}`);
    }

    try {
      const data = await request();
      return this.success(data);
    } catch (error: any) {
      return this.failure(error?.message || "Unknown error");
    }
  }

  async success<R>(result: R) {
    const script = `
      redis.call('SET', KEYS[1], 0)
      local state = redis.call('GET', KEYS[2])
      if state == 'HALF_OPEN' then
        redis.call('SET', KEYS[2], 'CLOSED')
      end
    `;

    await this.storage.eval(script, {
      keys: [this.storageFailureCountKey, this.storageStateKey],
    });

    return result;
  }

  async failure(error: any) {
    const script = `
      local failureCount = redis.call('INCR', KEYS[1])
      if tonumber(failureCount) >= tonumber(ARGV[3]) then
        redis.call('SET', KEYS[2], 'OPEN')
        redis.call('SET', KEYS[3], tostring(tonumber(ARGV[1]) + tonumber(ARGV[2])))
      end
    `;

    await this.storage.eval(script, {
      keys: [
        this.storageFailureCountKey,
        this.storageStateKey,
        this.storageResetAfterKey,
      ],
      arguments: [
        new Date().getTime().toString(),
        this.failureTimeout.toString(),
        this.failureThreshold.toString(),
      ],
    });

    throw new Error(error);
  }

  async initialize() {
    this.storage.set(this.storageStateKey, CircuitBreakerState.CLOSED);
    this.storage.set(this.storageFailureCountKey, 0);
    this.storage.set(this.storageResetAfterKey, 0);
  }
}
