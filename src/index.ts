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
import BullMqAdapter from "./infra/queue/queue";
import PaymentRepository from "./infra/repository/payment-repository";
import ProcessPaymentWorker from "./infra/workers/process-payment-worker";
import SaveProcessedPaymentWorker from "./infra/workers/save-processed-payment-worker";
import ProcessPaymentUseCase from "./use-cases/process-payment-use-case";
import SaveProcessedPaymentUseCase from "./use-cases/save-processed-payment-batch";

(async () => {
  const writeDatabaseConnection = new DatabasePgConnectionAdapter();
  const readDatabaseConnection = new DatabasePgConnectionAdapter();
  const processPaymentQueueName = `process-payment-queue-${process.env.INSTANCE_ID}`;
  const processPaymentQueue = new BullMqAdapter(processPaymentQueueName, 1);

  const createPaymentQueueName = `create-payment-queue-${process.env.INSTANCE_ID}`;
  const saveProcessedPaymentScheduler = new BullMqAdapter(
    createPaymentQueueName,
    2
  );
  saveProcessedPaymentScheduler.queue.upsertJobScheduler("save-job", {
    every: 50,
  });

  const writePaymentRepository = new PaymentRepository(writeDatabaseConnection);
  const readPaymentRepository = new PaymentRepository(readDatabaseConnection);

  const paymentsController = new PaymentsController(processPaymentQueue);

  const paymentsSummaryController = new PaymentsSummaryController(
    readPaymentRepository
  );

  const httpClient = new HttpClient();
  const redis = new RedisAdapter();

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

  await redis.connect();
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
    redis
  );

  const saveProcessedPaymentUseCase = new SaveProcessedPaymentUseCase(
    writePaymentRepository,
    redis
  );

  const processPaymentWorker = new ProcessPaymentWorker(
    processPaymentQueue,
    processPaymentUseCase
  );
  const saveProcessedPaymentWorker = new SaveProcessedPaymentWorker(
    saveProcessedPaymentScheduler,
    saveProcessedPaymentUseCase
  );

  await processPaymentWorker.init();
  await saveProcessedPaymentWorker.init();

  serve({
    hostname: process.env.APP_HOST,
    port: Number(process.env.PORT),
    reusePort: true,
    routes: {
      "/": new Response("Hello World", { status: 200 }),
      "/payments-summary": (req) => paymentsSummaryController.execute(req),
      "/payments": { POST: (req) => paymentsController.execute(req) },
    },
  });

  console.log(`Server listening on PORT: ${process.env.PORT}`);
})();
