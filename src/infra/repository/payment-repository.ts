import config from "../../config";
import Cache from "../../types/cache";
import { PaymentDAO } from "../../types/payment-dto";
import IPaymentRepository from "../../types/payment-repository";
import ProcessorEnum from "../../types/processor";
import Summary from "../../types/summary";
import { DatabaseConnection } from "../database/postgres-adapter";

export default class PaymentRepository implements IPaymentRepository {
  constructor(
    private readonly database: DatabaseConnection,
    private readonly cache: Cache
  ) {}

  async create(payment: PaymentDAO): Promise<void> {
    await this.database.query(
      `
      INSERT INTO transactions (correlation_id, requested_at, amount, processor) VALUES ($1, $2, $3, $4)
      ON CONFLICT (correlation_id) DO NOTHING`,
      [
        payment.correlationId,
        payment.requestedAt,
        payment.amount,
        payment.processor,
      ]
    );
  }

  async createMany(payments: PaymentDAO[]): Promise<void> {
    if (payments.length === 0) return;
    const values: any[] = [];
    const valuePlaceholders = payments.map((p, i) => {
      const index = i * 4;
      values.push(p.correlationId, p.requestedAt, p.amount, p.processor);
      return `($${index + 1}, $${index + 2}, $${index + 3}, $${index + 4})`;
    });

    const query = `
    INSERT INTO transactions (correlation_id, requested_at, amount, processor)
    VALUES ${valuePlaceholders.join(", ")}
  `;

    await this.database.query(query, values);
  }

  async summary(from: string, to: string): Promise<Summary> {
    const [defaultPayments, fallbackPayments] = (
      await this.database.query(
        `
        SELECT processor, COUNT(amount) AS "totalRequests", SUM(amount) AS "totalAmount"
        FROM transactions
        WHERE requested_at BETWEEN $1 AND $2
        GROUP BY processor
        ORDER BY processor
      `,
        [from, to]
      )
    ).rows;
    return {
      default: {
        totalAmount: +defaultPayments?.totalAmount || 0,
        totalRequests: +defaultPayments?.totalRequests || 0,
      },
      fallback: {
        totalAmount: +fallbackPayments?.totalAmount || 0,
        totalRequests: +fallbackPayments?.totalRequests || 0,
      },
    };
  }

  async cachedSummary(from: string, to: string): Promise<Summary> {
    const [START, END] = [0, -1];
    const payments = await this.cache.lRange(
      config.processedPaymentsKey,
      START,
      END
    );

    const defaultPayments = payments.filter(
      this.filterPaymentsFromCache(from, to, ProcessorEnum.DEFAULT)
    );
    const fallbackPayments = payments.filter(
      this.filterPaymentsFromCache(from, to, ProcessorEnum.FALLBACK)
    );

    const defaultPaymentsSummary = defaultPayments.reduce(
      (acc, payment) => {
        acc.totalAmount += JSON.parse(payment).amount;
        acc.totalRequests++;
        return acc;
      },
      { totalAmount: 0, totalRequests: 0 }
    );

    const fallbackPaymentsSummary = fallbackPayments.reduce(
      (acc, payment) => {
        acc.totalAmount += JSON.parse(payment).amount;
        acc.totalRequests++;
        return acc;
      },
      { totalAmount: 0, totalRequests: 0 }
    );

    return {
      default: {
        totalAmount: defaultPaymentsSummary.totalAmount,
        totalRequests: defaultPaymentsSummary.totalRequests,
      },
      fallback: {
        totalAmount: fallbackPaymentsSummary.totalAmount,
        totalRequests: fallbackPaymentsSummary.totalRequests,
      },
    };
  }

  private filterPaymentsFromCache(
    from: string,
    to: string,
    selectedProcessor: ProcessorEnum
  ) {
    return (payment: string) => {
      const { requestedAt, processor } = JSON.parse(payment);
      return (
        new Date(requestedAt).getTime() >= new Date(from).getTime() &&
        new Date(requestedAt).getTime() <= new Date(to).getTime() &&
        processor === selectedProcessor
      );
    };
  }
}
