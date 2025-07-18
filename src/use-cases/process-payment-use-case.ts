import PaymentDTO from "../types/payment-dto";
import IPaymentGateway from "../types/payment-gateway";
import IPaymentRepository from "../types/payment-repository";

export default class ProcessPaymentUseCase {
  constructor(
    private readonly defaultPaymentGateway: IPaymentGateway,
    private readonly fallbackPaymentGateway: IPaymentGateway,
    private readonly paymentRepository: IPaymentRepository
  ) {}

  async execute(payment: PaymentDTO): Promise<void> {
    try {
      await this.defaultPaymentGateway.process(payment);
      await this.paymentRepository.create({
        ...payment,
        processor: "default",
      });
    } catch (error) {
      await this.fallbackPaymentGateway.process(payment);
      await this.paymentRepository.create({
        ...payment,
        processor: "fallback",
      });
    }
  }
}
