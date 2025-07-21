import { PaymentDAO } from "../types/payment-dto";
import IPaymentRepository from "../types/payment-repository";

export default class SaveProcessedPaymentUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}
  async execute(payment: PaymentDAO) {
    await this.paymentRepository.create(payment);
  }
}
