import IPaymentRepository from "../../types/payment-repository";

export default class PaymentsSummaryController {
  constructor(readonly paymentsRepository: IPaymentRepository) {}

  async execute(req: Bun.BunRequest) {
    const url = new URL(req.url);
    const from = url.searchParams.get(`from`);
    const to = url.searchParams.get(`to`);
    if (!from || !to) return Response.json(null, { status: 400 });
    const summary = await this.paymentsRepository.summary(from, to);
    return Response.json(summary, { status: 200 });
  }
}
