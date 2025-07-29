import config from "../../config";
import ProcessPaymentUseCase from "../../use-cases/process-payment";
import CircuitBreaker from "../circuit-breaker";
import RedisAdapter from "../database/redis-adapter";
import CircuitPaymentProcessor from "../http/circuit-payment-processor";
import HttpClient from "../http/httpClient";
import PaymentProcessorDefault from "../http/payment-processor-default";
import PaymentProcessorFallback from "../http/payment-processor-fallback";

(async () => {
  const redisAdapter = new RedisAdapter();
  await redisAdapter.connect();
  const httpClient = new HttpClient();

  const circuitBreakerDefault = new CircuitBreaker({
    failureThreshold: 3,
    failureTimeout: 3,
    storage: redisAdapter,
    key: "payment-processor-default",
  });

  const circuitBreakerFallback = new CircuitBreaker({
    failureThreshold: 3,
    failureTimeout: 3,
    storage: redisAdapter,
    key: "payment-processor-fallback",
  });

  await circuitBreakerDefault.initialize();
  await circuitBreakerFallback.initialize();

  const paymentProcessorGatewayDefault = new PaymentProcessorDefault(
    httpClient
  );

  const paymentProcessorGatewayFallback = new PaymentProcessorFallback(
    httpClient
  );

  const paymentGatewayDefault = new CircuitPaymentProcessor(
    paymentProcessorGatewayDefault,
    circuitBreakerDefault
  );

  const paymentGatewayFallback = new CircuitPaymentProcessor(
    paymentProcessorGatewayFallback,
    circuitBreakerFallback
  );

  const processPaymentUseCase = new ProcessPaymentUseCase(
    paymentGatewayDefault,
    paymentGatewayFallback,
    redisAdapter
  );

  while (true) {
    console.log("WORKER 1: processPaymentUseCase");
    await processPaymentUseCase.execute();
    Bun.sleepSync(config.workers.processPayments.interval);
  }
})();
