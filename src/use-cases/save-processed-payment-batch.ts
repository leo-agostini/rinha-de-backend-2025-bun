import config from "../config";
import Cache from "../types/cache";
import IPaymentRepository from "../types/payment-repository";

const BATCH_SIZE = config.workers.saveProcessedPayments.batchSize;

const key = config.workers.saveProcessedPayments.queueName;
export default class SaveProcessedPaymentBatchUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly cache: Cache
  ) {}

  async execute() {
    try {
      const response = await this.cache.eval(
        `
        local values = redis.call('LRANGE', KEYS[1], 0, tonumber(ARGV[1]) - 1)
        if #values > 0 then
          redis.call('LTRIM', KEYS[1], tonumber(ARGV[1]), -1)
        end
        return values
        `,
        {
          keys: [key],
          arguments: [String(BATCH_SIZE + 1)], // manter consistência com lRange(0, BATCH_SIZE)
        }
      );
      const payments = response.map((payment) => JSON.parse(payment));

      if (payments.length === 0) return;
      await this.paymentRepository.createMany(payments);
      // await this.cache.lTrim(key, BATCH_SIZE + 1, -1);
    } catch (error) {
      console.error(error);
    }
  }
}
