import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';

/** Yappy (Banco General) webhooks — wire when commercial credentials are issued. */
@Controller('webhooks/yappy')
export class YappyWebhookController {
  @Post()
  @HttpCode(200)
  async handleYappyWebhook(
    @Body() _payload: unknown,
    @Headers('authorization') _auth?: string,
  ) {
    return { received: true };
  }
}
