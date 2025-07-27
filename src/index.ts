import { serve } from "bun";
import CircuitBreaker from "./infra/circuit-breaker";
import PaymentsController from "./infra/controllers/payments-controller";
import PaymentsSummaryController from "./infra/controllers/payments-summary-controller";
import DatabasePgConnectionAdapter from "./infra/database/postgres-adapter";
import RedisAdapter from "./infra/database/redis-adapter";
import CircuitPaymentProcessor from "./infra/http/circuit-payment-processor";
import HttpClient from "./infra/http/httpClient";
import PaymentProcessorDefault from "./infra/http/payment-processor-default";
import PaymentProcessorFallback from "./infra/http/payment-processor-fallback";
import PaymentRepository from "./infra/repository/payment-repository";
import ProcessPaymentWorker from "./infra/workers/process-payment-worker";
import SaveProcessedPaymentWorker from "./infra/workers/save-processed-payment-worker";
import ProcessPaymentUseCase from "./use-cases/process-payment";
import SaveProcessedPaymentUseCase from "./use-cases/save-processed-payment-batch";
import config from "./config";

(async () => {
  // #region Infra
  const httpClient = new HttpClient();
  const redis = new RedisAdapter();
  await redis.connect();
  const writeDatabaseConnection = new DatabasePgConnectionAdapter();
  const readDatabaseConnection = new DatabasePgConnectionAdapter();

  const writePaymentRepository = new PaymentRepository(writeDatabaseConnection);
  const readPaymentRepository = new PaymentRepository(readDatabaseConnection);

  // #endregion

  // #region Controllers

  const paymentsController = new PaymentsController(redis);
  const paymentsSummaryController = new PaymentsSummaryController(
    readPaymentRepository
  );

  // #endregion

  // #region Circuit Breaker

  const circuitBreakerDefault = new CircuitBreaker({
    failureThreshold: 3,
    failureTimeout: 3,
    storage: redis,
    key: "payment-processor-default",
  });

  const circuitBreakerFallback = new CircuitBreaker({
    failureThreshold: 3,
    failureTimeout: 3,
    storage: redis,
    key: "payment-processor-fallback",
  });

  await circuitBreakerDefault.initialize();
  await circuitBreakerFallback.initialize();

  // #endregion

  // #region Payment Processors

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

  // #endregion

  // #region Use Cases

  const processPaymentUseCase = new ProcessPaymentUseCase(
    paymentGatewayDefault,
    paymentGatewayFallback,
    redis
  );

  const saveProcessedPaymentUseCase = new SaveProcessedPaymentUseCase(
    writePaymentRepository,
    redis
  );

  // #endregion

  // #region Workers

  const processPaymentWorker = new ProcessPaymentWorker(processPaymentUseCase);
  const saveProcessedPaymentWorker = new SaveProcessedPaymentWorker(
    saveProcessedPaymentUseCase
  );

  await processPaymentWorker.init();
  await saveProcessedPaymentWorker.init();

  // #endregion

  serve({
    hostname: config.server.hostname,
    port: config.server.port,
    routes: {
      "/": new Response("Hello World", { status: 200 }),
      "/payments-summary": (req) => paymentsSummaryController.execute(req),
      "/payments": { POST: (req) => paymentsController.execute(req) },
    },
  });

  console.log(`Server listening on PORT: ${process.env.PORT}`);
})();
