import { All, Body, Controller, Query, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('test')
export class WebhookController {
  @All()
  logAll(@Req() req: Request, @Body() body: any, @Query() query: any) {
    console.log('=== WEBHOOK REQUEST ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Path:', req.path);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Query Params:', JSON.stringify(query, null, 2));
    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('IP:', req.ip);
    console.log('Raw Body:', body);
    console.log('======================');

    return {
      message: 'Webhook recibido',
      method: req.method,
      path: req.path,
      query,
      body,
    };
  }
}
