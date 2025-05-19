import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { SkipAuth } from "@decorators/skip-auth.decorator";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @SkipAuth()
  @Get()
  health() {
    return this.appService.getHello();
  }
}
