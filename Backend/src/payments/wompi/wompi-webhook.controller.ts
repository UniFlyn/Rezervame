import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';

/** Wompi Panama webhooks — wire signature verification when merchant account is live. */
@Controller('webhooks/wompi')
export class WompiWebhookController {
  @Post()
  @HttpCode(200)
  async handleWompiWebhook(
    @Body() _payload: unknown,
    @Headers('x-wompi-signature') _signature?: string,
  ) {
    return { received: true };
  }
}
