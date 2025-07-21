import Cache from "../types/cache";
import CircuitBreakerState from "../types/circuit-breaker-state";

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
  }

  async fire<R>(request: () => Promise<R>) {
    const remoteState = await this.storage.get(this.storageStateKey);
    const isOpen = remoteState === CircuitBreakerState.OPEN;
    if (isOpen) throw new Error(`Circuit breaker is open - ${this.key}`);
    try {
      const data = await request();
      await this.storage.set(this.storageFailureCountKey, 0);
      return data;
    } catch (error: any) {
      return this.failure(error?.message || "Unknown error");
    }
  }

  async failure(error: any) {
    const script = `
      local failureCount = redis.call('INCR', KEYS[1])
      if tonumber(failureCount) >= tonumber(ARGV[2]) then
        redis.call('SET', KEYS[2], 'OPEN', 'EX', ARGV[1])
      end
    `;

    await this.storage.eval(script, {
      keys: [this.storageFailureCountKey, this.storageStateKey],
      arguments: [
        this.failureTimeout.toString(),
        this.failureThreshold.toString(),
      ],
    });

    throw new Error(error);
  }

  async initialize() {
    await this.storage.set(this.storageStateKey, CircuitBreakerState.CLOSED);
    await this.storage.set(this.storageFailureCountKey, 0);
  }
}
