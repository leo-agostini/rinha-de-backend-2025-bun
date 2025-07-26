import Cache from "../types/cache";
import IPaymentRepository from "../types/payment-repository";

const [start, stop] = [0, 100];
const key = `${process.env.INSTANCE_ID}:processed-payments`;
export default class SaveProcessedPaymentBatchUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly cache: Cache
  ) {}

  async execute() {
    const response = await this.cache.lRange(key, start, stop);
    const payments = response.map((payment) => JSON.parse(payment));

    if (payments.length === 0) return;
    await this.paymentRepository.createMany(payments);
    await this.cache.lTrim(key, stop + 1, -1);
  }
}
