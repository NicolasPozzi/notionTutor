/** Circuit breaker for external service resilience (ARCH-10) */

type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening (default: 5) */
  failureThreshold: number;
  /** Time in ms before attempting to close (default: 60000) */
  resetTimeoutMs: number;
  /**
   * Whether an error means the service is down (default: every error).
   * Errors that prove the service answered (e.g. HTTP 4xx caused by the
   * caller's input) should return false: they count as a healthy response,
   * so one user's bad requests can't open the circuit for everyone.
   */
  isOutage: (error: unknown) => boolean;
}

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private lastFailureTime = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(options?: Partial<CircuitBreakerOptions>) {
    this.options = {
      failureThreshold: options?.failureThreshold ?? 5,
      resetTimeoutMs: options?.resetTimeoutMs ?? 60_000,
      isOutage: options?.isOutage ?? (() => true),
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeoutMs) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      if (this.options.isOutage(error)) {
        this.onFailure();
      } else {
        this.onSuccess();
      }
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.options.failureThreshold) {
      this.state = "open";
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
