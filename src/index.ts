import { serve } from "bun";
import { Worker } from "worker_threads";
import config from "./config";
import PaymentsController from "./infra/controllers/payments-controller";
import PaymentsSummaryController from "./infra/controllers/payments-summary-controller";
import DatabasePgConnectionAdapter from "./infra/database/postgres-adapter";
import RedisAdapter from "./infra/database/redis-adapter";
import PaymentRepository from "./infra/repository/payment-repository";

(async () => {
  const redisAdapter = new RedisAdapter();
  await redisAdapter.connect();
  const readDatabaseConnection = new DatabasePgConnectionAdapter();
  const readPaymentRepository = new PaymentRepository(readDatabaseConnection);

  const paymentsController = new PaymentsController(redisAdapter);
  const paymentsSummaryController = new PaymentsSummaryController(
    readPaymentRepository
  );

  const processWorker = new Worker("./workers/process.js");
  const saveWorker = new Worker("./workers/save.js");

  processWorker.on("message", (msg) => console.log("[process]", msg));
  processWorker.on("error", (err) => console.error("[process ERROR]", err));
  processWorker.on("exit", (code) => console.log("[process EXIT]", code));

  saveWorker.on("message", (msg) => console.log("[save]", msg));
  saveWorker.on("error", (err) => console.error("[save ERROR]", err));
  saveWorker.on("exit", (code) => console.log("[save EXIT]", code));

  serve({
    hostname: config.server.hostname,
    port: config.server.port,
    routes: {
      "/": new Response("Hello World", { status: 200 }),
      "/payments-summary": (req) => paymentsSummaryController.execute(req),
      "/payments": { POST: (req) => paymentsController.execute(req) },
    },
  });

  console.log(`Server listening on PORT: ${process.env.PORT}`);
})();
