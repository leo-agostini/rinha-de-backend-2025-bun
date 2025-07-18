import PaymentDTO from "./payment-dto";

export default interface IPaymentRepository {
  create(
    payment: PaymentDTO & { processor: "default" | "fallback" }
  ): Promise<void>;
  summary(startDate: string, endDate: string): Promise<void>;
}
