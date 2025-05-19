import { Controller, Post } from "@nestjs/common";
import { WebhookService } from "./webhook.service";

@Controller("webhook")
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async getWebhook() {
    return this.webhookService.findAll();
  }
}
