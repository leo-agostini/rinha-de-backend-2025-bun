import { Queue } from "bullmq";

export default class BullMqAdapter {
  private readonly queue: Queue;

  constructor(readonly queueName: string, readonly db = 1) {
    this.queue = new Queue(queueName, {
      connection: {
        url: "host.docker.internal",
        port: Number(process.env.REDIS_PORT),
        db,
      },
    });
  }

  async add(jobName: string, data: any): Promise<void> {
    await this.queue.add(jobName, data, {
      removeOnComplete: true,
      jobId: data.correlationId,
      removeOnFail: { count: 3 },
      backoff: {
        type: "fixed",
        delay: 3000,
      },
    });
  }
}
