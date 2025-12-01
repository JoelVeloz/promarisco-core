import { All, Body, Controller, Logger, Query, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('test')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  @All()
  logAll(@Req() req: Request, @Body() body: any, @Query() query: any) {
    this.logger.log('=== WEBHOOK REQUEST ===');
    this.logger.log(`Method: ${req.method}`);
    this.logger.log(`URL: ${req.url}`);
    this.logger.log(`Path: ${req.path}`);
    this.logger.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
    this.logger.log(`Query Params: ${JSON.stringify(query, null, 2)}`);
    this.logger.log(`Body: ${JSON.stringify(body, null, 2)}`);
    this.logger.log(`IP: ${req.ip}`);
    this.logger.log('======================');

    return {
      message: 'Webhook recibido',
      method: req.method,
      path: req.path,
      query,
      body,
      headers: req.headers,
    };
  }
}

