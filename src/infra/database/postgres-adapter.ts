import { Pool, PoolConfig, QueryResult } from "pg";
import config from "../../config";

type Primitive = string | number;

export interface DatabaseConnection {
  query(query: string, args: Primitive[]): Promise<QueryResult<any>>;
}

class DatabasePgConnectionAdapter implements DatabaseConnection {
  pool: Pool;

  constructor(poolConfig: PoolConfig) {
    this.pool = new Pool(poolConfig);

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

export default new DatabasePgConnectionAdapter(config.postgres);
