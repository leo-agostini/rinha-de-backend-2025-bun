export default {
  processedPaymentsKey: "processed-payments",
  circuitBreaker: {
    failureThreshold: 3,
    failureTimeout: 3,
    key_default: "payment-processor-default",
    key_fallback: "payment-processor-fallback",
  },
  redis: {
    url: process.env.REDIS_URL,
    db: 0,
  },
  postgres: {
    host: "host.docker.internal",
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: Number(process.env.POSTGRES_PORT),
    min: 2,
    max: 5,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 1000,
  },
  workers: {
    saveProcessedPayments: {
      numberOfWorkers: 1,
      interval: 10,
      batchSize: 50,
      queueName: `${process.env.INSTANCE_ID}:processed-payments`,
    },
    processPayments: {
      numberOfWorkers: 1,
      interval: 250,
      batchSize: 50,
      queueName: `${process.env.INSTANCE_ID}:process-payments`,
    },
  },
  server: {
    hostname: process.env.APP_HOST,
    port: Number(process.env.PORT),
  },
};
