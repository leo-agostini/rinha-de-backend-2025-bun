import IHttpClient from "../types/http-client";
import PaymentDTO from "../types/payment-dto";
import PaymentGateway from "../types/payment-gateway";

export default class PaymentProcessorFallback implements PaymentGateway {
  constructor(private readonly httpClient: IHttpClient) {}

  async process(payment: PaymentDTO): Promise<void> {
    await this.httpClient.post(
      `${process.env.PROCESSOR_FALLBACK_URL}/payments`,
      payment
    );
  }
}
