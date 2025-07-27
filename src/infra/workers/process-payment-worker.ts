import config from "../../config";
import ProcessPaymentUseCase from "../../use-cases/process-payment";

export default class ProcessPaymentWorker {
  constructor(private readonly processPaymentUseCase: ProcessPaymentUseCase) {}

  async execute() {
    try {
      await this.processPaymentUseCase.execute();
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async init() {
    while (true) {
      await this.execute();
      await Bun.sleep(config.workers.processPayments.interval);
    }
  }
}
