import IHttpClient from "../types/http-client";
import PaymentDTO from "../types/payment-dto";
import PaymentGateway from "../types/payment-gateway";

export default class PaymentProcessor implements PaymentGateway {
  constructor(private readonly httpClient: IHttpClient) {}

  async process(payment: PaymentDTO): Promise<void> {
    return this.httpClient.post(
      `${process.env.PROCESSOR_DEFAULT_URL}/payments`,
      payment
    );
  }
}
