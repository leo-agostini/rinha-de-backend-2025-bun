import BullMqAdapter from "../infra/queue/queue";
import PaymentDTO, { PaymentDAO } from "../types/payment-dto";
import IPaymentGateway from "../types/payment-gateway";
import ProcessorEnum from "../types/processor";
import StatusEnum from "../types/status";

export default class ProcessPaymentUseCase {
  constructor(
    private readonly defaultPaymentGateway: IPaymentGateway,
    private readonly fallbackPaymentGateway: IPaymentGateway,
    private readonly queue: BullMqAdapter
  ) {}

  async execute(payment: PaymentDTO): Promise<void> {
    let processor = ProcessorEnum.DEFAULT;
    try {
      await this.defaultPaymentGateway.process(payment);
    } catch (error) {
      processor = ProcessorEnum.FALLBACK;
      await this.fallbackPaymentGateway.process(payment).catch(() => {
        throw error;
      });
    }

    await this.queue.add("payment-created-on-gateway", {
      ...payment,
      processor,
      status: StatusEnum.COMPLETED,
    } as PaymentDAO);
  }
}
