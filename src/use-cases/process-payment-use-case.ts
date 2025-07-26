import Cache from "../types/cache";
import PaymentDTO, { PaymentDAO } from "../types/payment-dto";
import IPaymentGateway from "../types/payment-gateway";
import ProcessorEnum from "../types/processor";
import StatusEnum from "../types/status";

export default class ProcessPaymentUseCase {
  constructor(
    private readonly defaultPaymentGateway: IPaymentGateway,
    private readonly fallbackPaymentGateway: IPaymentGateway,
    private readonly cache: Cache
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

    const toSavePayment: PaymentDAO = {
      ...payment,
      processor,
      status: StatusEnum.COMPLETED,
    };

    await this.cache.lPush(
      `${process.env.INSTANCE_ID}:processed-payments`,
      JSON.stringify(toSavePayment)
    );
  }
}
