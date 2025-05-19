import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { json, urlencoded } from "express";
import { ConfigService } from "@nestjs/config";
import { BullBoardConfig } from "./config/bullboard.config";
// import { Queue } from "bullmq";
// import { getQueueToken } from "@nestjs/bullmq";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ResponseInterceptor } from "@middlewares/response.interceptor";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = app.get(Logger);

  app.use(
    express.json({
      verify: (req: express.Request, res: express.Response, buf: Buffer) => {
        if (req.url.includes("/webhook")) {
          (req as any).rawBody = buf;
        }
      },
    }),
  );
  app.use(json({ limit: "20mb" }));
  app.use(urlencoded({ limit: "100mb", extended: true }));
  app.enableCors();
  app.setGlobalPrefix("api/v1");
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
  // app.useGlobalPipes(new ValidationPipe());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Eazi Pay Wallet")
    .setDescription("API documentation for Eazi Pay Wallet")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  const port = config.get<string>("PORT");

  BullBoardConfig(app, []);

  const server = await app.listen(port);
  server.setTimeout(1200000);
  logger.log("Server started on port " + port);
}

bootstrap().catch((err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});
