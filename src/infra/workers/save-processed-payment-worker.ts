import { Worker } from "bullmq";
import SaveProcessedPaymentUseCase from "../../use-cases/save-processed-payment-batch";
import BullMqAdapter from "../queue/queue";

export default class SaveProcessedPaymentWorker {
  constructor(
    private readonly queue: BullMqAdapter,
    private readonly saveProcessedPaymentUseCase: SaveProcessedPaymentUseCase
  ) {}

  async execute() {
    try {
      await this.saveProcessedPaymentUseCase.execute();
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async init() {
    new Worker(this.queue.queueName, this.execute.bind(this), {
      concurrency: 1,
      connection: { url: process.env.REDIS_URL, db: this.queue.db },
    });
  }
}
