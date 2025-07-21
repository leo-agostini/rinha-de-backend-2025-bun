import { Job, Worker } from "bullmq";
import ProcessPaymentUseCase from "../../use-cases/process-payment-use-case";
import BullMqAdapter from "../queue/queue";

export default class ProcessPaymentWorker {
  constructor(
    private readonly queue: BullMqAdapter,
    private readonly processPaymentUseCase: ProcessPaymentUseCase
  ) {}

  async execute(job: Job) {
    try {
      await this.processPaymentUseCase.execute(job.data);
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
