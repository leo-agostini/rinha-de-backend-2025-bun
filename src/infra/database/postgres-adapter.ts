import { Pool, QueryResult } from "pg";

type Primitive = string | number;

export interface DatabaseConnection {
  query(query: string, args: Primitive[]): Promise<QueryResult<any>>;
}

class DatabasePgConnectionAdapter implements DatabaseConnection {
  pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: "host.docker.internal",
      database: process.env.POSTGRES_DATABASE,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      port: Number(process.env.POSTGRES_PORT),
      min: 10,
      max: 25,
      idleTimeoutMillis: 1000,
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

  async query(query: string, args: Primitive[]) {
    const result = await this.pool.query(query, args);
    return result;
  }
}

export default new DatabasePgConnectionAdapter();
