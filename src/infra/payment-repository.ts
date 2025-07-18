import PaymentDTO from "../types/payment-dto";
import IPaymentRepository from "../types/payment-repository";
import { DatabasePgConnectionAdapter } from "./postgres-adapter";

export default class PaymentRepository implements IPaymentRepository {
  constructor(private readonly database: DatabasePgConnectionAdapter) {}

  async create(
    payment: PaymentDTO & { processor: "default" | "fallback" }
  ): Promise<void> {
    const client = await this.database.client();
    await client.query(
      `INSERT INTO transactions (correlation_id, requested_at, amount, processor) VALUES ($1, $2, $3, $4)`,
      [
        payment.correlationId,
        payment.requestedAt,
        payment.amount,
        payment.processor,
      ]
    );
    client.release();
  }

  async summary(startDate: string, endDate: string): Promise<void> {
    const client = await this.database.client();
    const result = await client.query(`SELECT summary($1, $2)`, [
      startDate,
      endDate,
    ]);
    client.release();
    return result.rows[0]?.summary;
  }
}
