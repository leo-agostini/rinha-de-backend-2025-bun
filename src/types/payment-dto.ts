import ProcessorEnum from "./processor";

export default interface PaymentDTO {
  correlationId: string;
  amount: number;
  requestedAt: string;
}

export interface PaymentDAO extends PaymentDTO {
  processor: ProcessorEnum;
}
