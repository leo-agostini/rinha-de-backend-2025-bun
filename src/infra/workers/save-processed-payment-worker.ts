import { Job, Worker } from "bullmq";
import SaveProcessedPaymentUseCase from "../../use-cases/save-processed-payment-use-case";
import BullMqAdapter from "../queue/queue";

export default class SaveProcessedPaymentWorker {
  constructor(
    private readonly queue: BullMqAdapter,
    private readonly saveProcessedPaymentUseCase: SaveProcessedPaymentUseCase
  ) {}

  async execute(job: Job) {
    try {
      await this.saveProcessedPaymentUseCase.execute(job.data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async init() {
    new Worker(this.queue.queueName, this.execute.bind(this), {
      concurrency: 20,
      connection: { url: process.env.REDIS_URL, db: this.queue.db },
    });
  }
}
