import { Queue } from "bullmq";

export default class BullMqAdapter {
  public readonly queue: Queue;
  constructor(readonly queueName: string) {
    this.queue = new Queue(this.queueName, {
      connection: {
        url: `redis://${process.env.REDIS_URL}`,
        db: 1,
      },
    });
  }

  async add(jobName: string, data: any, jobId: string): Promise<void> {
    await this.queue.add(jobName, data, {
      removeOnComplete: true,
      attempts: 3,
      backoff: {
        type: "fixed",
        delay: 1000,
      },
      jobId,
    });
  }
}
