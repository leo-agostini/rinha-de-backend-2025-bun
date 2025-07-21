import ProcessorEnum from "./processor";
import StatusEnum from "./status";

export default interface PaymentDTO {
  correlationId: string;
  amount: number;
  requestedAt: string;
}

export interface PaymentDAO extends PaymentDTO {
  processor: ProcessorEnum;
  status: StatusEnum;
}
