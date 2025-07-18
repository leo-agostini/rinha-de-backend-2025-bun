import PaymentDTO from "./payment-dto";

export default interface IPaymentGateway {
  process(payment: PaymentDTO): Promise<void>;
}
