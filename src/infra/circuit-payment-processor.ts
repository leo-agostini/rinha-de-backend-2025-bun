import PaymentDTO from "../types/payment-dto";
import IPaymentGateway from "../types/payment-gateway";
import CircuitBreaker from "./circuit-breaker";

export default class CircuitPaymentProcessor {
  constructor(
    private readonly paymentRepository: IPaymentGateway,
    private readonly circuitBreaker: CircuitBreaker
  ) {}

  async process(payment: PaymentDTO): Promise<void> {
    await this.circuitBreaker.fire(async () => {
      await this.paymentRepository.process(payment);
    });
  }
}
