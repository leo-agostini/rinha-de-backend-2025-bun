export enum CircuitBreakerStatus {
  CLOSED,
  HALF_OPEN,
  OPEN,
}

export default interface CircuitBreakerState {
  state: CircuitBreakerStatus;
  failureCount: number;
  resetAfter: number;
}
