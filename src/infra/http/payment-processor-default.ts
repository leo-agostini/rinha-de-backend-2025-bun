import IHttpClient from "../../types/http-client";
import PaymentDTO from "../../types/payment-dto";
import IPaymentGateway from "../../types/payment-gateway";

export default class PaymentProcessorDefault implements IPaymentGateway {
  constructor(private readonly httpClient: IHttpClient) {}

  async process(payment: PaymentDTO): Promise<void> {
    return this.httpClient.post(
      `${process.env.PAYMENT_PROCESSOR_DEFAULT_URL}/payments`,
      payment
    );
  }
}
