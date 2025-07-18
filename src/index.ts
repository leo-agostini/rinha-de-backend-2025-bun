import Fastify from "fastify";
import CircuitBreaker from "./infra/circuit-breaker";
import CircuitPaymentProcessor from "./infra/circuit-payment-processor";
import HttpClient from "./infra/httpClient";
import PaymentProcessor from "./infra/payment-processor";
import PaymentProcessorFallback from "./infra/payment-processor-fallback";
import PaymentRepository from "./infra/payment-repository";
import { DatabasePgConnectionAdapter } from "./infra/postgres-adapter";
import RedisAdapter from "./infra/redis-adapter";
import PaymentDTO from "./types/payment-dto";
import ProcessPaymentUseCase from "./use-cases/process-payment-use-case";

(async () => {
  const postgres = new DatabasePgConnectionAdapter();
  const redis = new RedisAdapter();
  await redis.connect();

  const defaultCircuitBreaker = new CircuitBreaker({
    key: "payment-processor",
    failureThreshold: 3,
    failureTimeout: 3000,
    storage: redis,
  });

  await defaultCircuitBreaker.initialize();

  const fallbackCircuitBreaker = new CircuitBreaker({
    key: "payment-processor-fallback",
    failureThreshold: 3,
    failureTimeout: 3000,
    storage: redis,
  });

  await fallbackCircuitBreaker.initialize();

  const httpClient = new HttpClient();

  const defaultPaymentGateway = new PaymentProcessor(httpClient);
  const fallbackPaymentGateway = new PaymentProcessorFallback(httpClient);

  const circuitPaymentProcessor = new CircuitPaymentProcessor(
    defaultPaymentGateway,
    defaultCircuitBreaker
  );

  const circuitPaymentProcessorFallback = new CircuitPaymentProcessor(
    fallbackPaymentGateway,
    fallbackCircuitBreaker
  );

  const paymentRepository = new PaymentRepository(postgres);

  const processPaymentService = new ProcessPaymentUseCase(
    circuitPaymentProcessor,
    circuitPaymentProcessorFallback,
    paymentRepository
  );

  const fastify = Fastify({
    logger: true,
  });

  fastify.get("/", function (request, reply) {
    reply.send({ hello: "world" });
  });

  fastify.post("/payments", async (request, reply) => {
    const payment = {
      ...(request.body as any),
      requestedAt: new Date().toISOString(),
    } as PaymentDTO;
    await processPaymentService.execute(payment);
    reply.send({ message: "Payment processed" }).status(201);
  });

  fastify.get("/payments-summary", async (request, reply) => {
    const query = request.query as any;
    const payments = await paymentRepository.summary(query.from, query.to);

    reply.send(payments).status(200);
  });

  fastify.listen({ port: 8080, host: "0.0.0.0" }, function (err, address) {
    if (err) {
      console.log(err);
      fastify.log.error(err);
      process.exit(1);
    }
  });
})();
