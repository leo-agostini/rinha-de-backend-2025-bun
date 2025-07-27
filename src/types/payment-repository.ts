import { PaymentDAO } from "./payment-dto";
import Summary from "./summary";

export default interface IPaymentRepository {
  create(payment: PaymentDAO): Promise<void>;
  createMany(payment: PaymentDAO[]): Promise<void>;
  summary(from: string, to: string): Promise<Summary>;
}
