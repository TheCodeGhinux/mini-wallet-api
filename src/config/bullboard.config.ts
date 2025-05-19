import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";

export function BullBoardConfig(app, queues: any[]) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: queues.map((queue) => new BullMQAdapter(queue)),
    serverAdapter,
  });

  app.use("/admin/queues", serverAdapter.getRouter());
}
