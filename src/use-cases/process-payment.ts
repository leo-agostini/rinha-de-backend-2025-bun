import config from "../config";
import Cache from "../types/cache";
import PaymentDTO from "../types/payment-dto";
import IPaymentGateway from "../types/payment-gateway";
import ProcessorEnum from "../types/processor";

const toProcessPaymentsQueueName = config.workers.processPayments.queueName;
const toSaveProcessedPaymentsQueueName =
  config.workers.saveProcessedPayments.queueName;
export default class ProcessPaymentUseCase {
  constructor(
    private readonly defaultPaymentGateway: IPaymentGateway,
    private readonly fallbackPaymentGateway: IPaymentGateway,
    private readonly cache: Cache
  ) {}

  async execute(): Promise<void> {
    const payment = await this.cache.pop(toProcessPaymentsQueueName);
    if (!payment) return;

    const paymentDTO = JSON.parse(payment) as PaymentDTO;
    let processor = ProcessorEnum.DEFAULT;

    try {
      await this.defaultPaymentGateway.process(paymentDTO);
    } catch (error) {
      processor = ProcessorEnum.FALLBACK;
      try {
        await this.fallbackPaymentGateway.process(paymentDTO);
      } catch (fallbackError) {
        await this.cache.lPush(toProcessPaymentsQueueName, payment);
        return;
      }
    }

    await this.cache.lPush(
      toSaveProcessedPaymentsQueueName,
      JSON.stringify({
        ...paymentDTO,
        processor,
      })
    );
  }
}
