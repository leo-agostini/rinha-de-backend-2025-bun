import { Pool, QueryResult } from "pg";
import config from "../../config";

type Primitive = string | number;

export interface DatabaseConnection {
  query(query: string, args: Primitive[]): Promise<QueryResult<any>>;
}

interface PoolConfig {
  min: number;
  max: number;
  idleTimeoutMillis: number;
  query_timeout: number;
}

export default class DatabasePgConnectionAdapter implements DatabaseConnection {
  pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: config.postgres.host,
      database: config.postgres.database,
      user: config.postgres.user,
      password: config.postgres.password,
      port: config.postgres.port,
      min: config.postgres.min,
      max: config.postgres.max,
      idleTimeoutMillis: config.postgres.idleTimeoutMillis,
      query_timeout: config.postgres.query_timeout,
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

  async query(query: string, args: Primitive[]) {
    const result = await this.pool.query(query, args);
    return result;
  }
}
