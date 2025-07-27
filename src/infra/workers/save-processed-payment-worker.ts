import SaveProcessedPaymentUseCase from "../../use-cases/save-processed-payment-batch";

export default class SaveProcessedPaymentWorker {
  constructor(
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
    setInterval(this.execute.bind(this), 50);
  }
}
