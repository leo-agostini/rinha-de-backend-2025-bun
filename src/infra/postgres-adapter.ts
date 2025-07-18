import { Pool, PoolClient } from "pg";

export default interface DatabaseConnection {
  client(): Promise<PoolClient>;
  disconnect(): Promise<void>;
}

export class DatabasePgConnectionAdapter implements DatabaseConnection {
  pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: "host.docker.internal",
      database: "rinha",
      user: "rinha",
      password: "rinha",
      port: 5432,
      min: 5,
      max: 35,
      query_timeout: 10000,
    });

    this.pool.on("connect", () => {
      console.log("Connected to the database");
    });

    this.pool.on("error", (err) => {
      console.log("Unexpected error on idle client", err);
      this.pool?.end();
      process.exit(-1);
    });
  }

  async disconnect(): Promise<void> {
    await this.pool?.end();
  }

  async client(): Promise<PoolClient> {
    const client = await this.pool?.connect();
    if (!client) {
      throw new Error("Failed to connect to the database");
    }
    return client;
  }
}
