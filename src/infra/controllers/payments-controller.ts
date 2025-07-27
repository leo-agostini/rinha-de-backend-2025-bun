import config from "../../config";
import Cache from "../../types/cache";
import PaymentDTO from "../../types/payment-dto";
export default class PaymentsController {
  constructor(private readonly cache: Cache) {}

  async execute(req: Bun.BunRequest) {
    const body = (await req.json()) as PaymentDTO;
    const queuePayload = JSON.stringify({
      ...body,
      requestedAt: new Date().toISOString(),
    });
    await this.cache.lPush(
      config.workers.processPayments.queueName,
      queuePayload
    );
    return new Response(null, { status: 201 });
  }
}
