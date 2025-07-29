import config from "../../config";
import SaveProcessedPaymentUseCase from "../../use-cases/save-processed-payment-batch";
import DatabasePgConnectionAdapter from "../database/postgres-adapter";
import RedisAdapter from "../database/redis-adapter";
import PaymentRepository from "../repository/payment-repository";
(async () => {
  const redisAdapter = new RedisAdapter();
  await redisAdapter.connect();
  const writeDatabaseConnection = new DatabasePgConnectionAdapter();
  const paymentRepository = new PaymentRepository(writeDatabaseConnection);
  const saveProcessedPaymentUseCase = new SaveProcessedPaymentUseCase(
    paymentRepository,
    redisAdapter
  );
  while (true) {
    console.log("WORKER 2: saveProcessedPaymentUseCase");
    await saveProcessedPaymentUseCase.execute();
    Bun.sleepSync(config.workers.saveProcessedPayments.interval);
  }
})();
