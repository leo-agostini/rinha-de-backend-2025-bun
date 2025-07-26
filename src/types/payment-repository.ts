import { PaymentDAO } from "./payment-dto";
import ProcessorEnum from "./processor";
import StatusEnum from "./status";
import Summary from "./summary";

type UpdateParams = {
  id: string;
  processor: ProcessorEnum;
  status: StatusEnum;
};
export default interface IPaymentRepository {
  create(payment: PaymentDAO): Promise<void>;
  createMany(payment: PaymentDAO[]): Promise<void>;
  update(params: UpdateParams): Promise<void>;
  summary(from: string, to: string): Promise<Summary>;
}
