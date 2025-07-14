import Cache from "../types/cache";
import { CircuitBreakerStatus } from "../types/circuit-breaker-state";

interface CircuitState {
  state: CircuitBreakerStatus;
  failureCount: number;
  resetAfter: number;
}

interface CircuitBreakerConfig<T> {
  key: string;
  failureThreshold: number; // Number of failures before opening the circuit
  failureTimeout: number; // Time to wait before trying again
  storage: Cache<Partial<CircuitState>, CircuitState>;
}

export default class CircuitBreaker<T> {
  constructor(private readonly config: CircuitBreakerConfig<T>) {}

  async fire<R>(request: () => Promise<R>, fallback?: () => Promise<R>) {
    const remoteState = await this.config.storage.get(this.config.key);

    if (remoteState.state === CircuitBreakerStatus.OPEN) {
      if (remoteState.resetAfter > new Date().getTime()) {
        await this.config.storage.set(this.config.key, {
          ...remoteState,
          state: CircuitBreakerStatus.HALF_OPEN,
        });
      } else {
        fallback && fallback();
        throw new Error(`Circuit breaker is open - ${this.config.key}`);
      }

      try {
        const data = await request();
        return this.success(data, remoteState);
      } catch (error: any) {
        return this.failure(error?.message || "Unknown error", remoteState);
      }
    }
  }

  async success<R>(result: R, remoteState: CircuitState) {
    remoteState.failureCount = 0;
    if (remoteState.state === CircuitBreakerStatus.HALF_OPEN) {
      remoteState.state = CircuitBreakerStatus.CLOSED;
    }

    await this.config.storage.set(this.config.key, {
      failureCount: 0,
      state: remoteState.state,
    });

    return result;
  }

  async failure(error: any, remoteState: CircuitState) {
    remoteState.failureCount += 1;

    if (
      remoteState.state === CircuitBreakerStatus.HALF_OPEN ||
      remoteState.failureCount >= this.config.failureThreshold
    ) {
      remoteState.state = CircuitBreakerStatus.OPEN;
      remoteState.resetAfter = Date.now() + this.config.failureTimeout;

      await this.config.storage.set(this.config.key, {
        state: remoteState.state,
        resetAfter: remoteState.resetAfter,
        failureCount: remoteState.failureCount,
      });
    } else {
      await this.config.storage.set(this.config.key, {
        failureCount: remoteState.failureCount,
      });
    }
    throw new Error(error);
  }
}
