import { Worker } from "bullmq";
import ProcessPaymentUseCase from "../use-cases/process-payment-use-case";
import BullMqAdapter from "./queue";

export default class PaymentProcessorWorker {
  constructor(
    readonly queue: BullMqAdapter,
    readonly processor: ProcessPaymentUseCase
  ) {
    new Worker(
      this.queue.queueName,
      async (job) => {
        const result = await this.processor.execute(job.data);
        return result;
      },
      {
        connection: {
          url: `redis://${process.env.REDIS_URL}`,
          db: 1,
        },
      }
    );
  }
}
