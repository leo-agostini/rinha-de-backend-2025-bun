import PaymentDTO from "../../types/payment-dto";
import BullMqAdapter from "../queue/queue";

export default class PaymentsController {
  constructor(private readonly queue: BullMqAdapter) {}

  async execute(req: Bun.BunRequest) {
    const body = (await req.json()) as PaymentDTO;
    const queuePayload = {
      ...body,
      requestedAt: new Date().toISOString(),
    };
    this.queue.add("process-payment", queuePayload);
    return new Response(null, { status: 201 });
  }
}
