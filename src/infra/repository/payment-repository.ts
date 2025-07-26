import { PaymentDAO } from "../../types/payment-dto";
import IPaymentRepository from "../../types/payment-repository";
import ProcessorEnum from "../../types/processor";
import StatusEnum from "../../types/status";
import Summary from "../../types/summary";
import { DatabaseConnection } from "../database/postgres-adapter";

export default class PaymentRepository implements IPaymentRepository {
  constructor(private readonly database: DatabaseConnection) {}

  async create(payment: PaymentDAO): Promise<void> {
    await this.database.query(
      `
      INSERT INTO transactions (correlation_id, requested_at, amount, processor, payment_status) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (correlation_id) DO NOTHING`,
      [
        payment.correlationId,
        payment.requestedAt,
        payment.amount,
        payment.processor,
        payment.status,
      ]
    );
  }

  async createMany(payments: PaymentDAO[]): Promise<void> {
    if (payments.length === 0) return;
    const values: any[] = [];
    const valuePlaceholders = payments.map((p, i) => {
      const index = i * 5;
      values.push(
        p.correlationId,
        p.requestedAt,
        p.amount,
        p.processor,
        p.status
      );
      return `($${index + 1}, $${index + 2}, $${index + 3}, $${index + 4}, $${
        index + 5
      })`;
    });

    const query = `
    INSERT INTO transactions (correlation_id, requested_at, amount, processor, payment_status)
    VALUES ${valuePlaceholders.join(", ")}
    ON CONFLICT (correlation_id) DO NOTHING
  `;

    await this.database.query(query, values);
  }

  async summary(from: string, to: string): Promise<Summary> {
    const [defaultPayments, fallbackPayments] = (
      await this.database.query(
        `
        SELECT processor, COUNT(*) AS "totalRequests", SUM(amount) AS "totalAmount"
        FROM transactions
        WHERE requested_at BETWEEN $1 AND $2 AND payment_status = 'completed' AND processor IS NOT NULL 
        GROUP BY processor
        ORDER BY processor
      `,
        [from, to]
      )
    ).rows;
    return {
      default: {
        totalAmount: Number(defaultPayments?.totalAmount) || 0,
        totalRequests: Number(defaultPayments?.totalRequests) || 0,
      },
      fallback: {
        totalAmount: Number(fallbackPayments?.totalAmount) || 0,
        totalRequests: Number(fallbackPayments?.totalRequests) || 0,
      },
    };
  }

  async update({
    id,
    processor,
    status,
  }: {
    id: string;
    processor: ProcessorEnum;
    status: StatusEnum;
  }) {
    await this.database.query(
      `UPDATE transactions
        SET
        payment_status = $1,
        processor = $2
        WHERE correlation_id = $3 AND status = 'pending';
      `,
      [status, processor, id]
    );
  }
}
