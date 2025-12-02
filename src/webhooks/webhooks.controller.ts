import { All, Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly prisma: PrismaService) {}
  @All('test')
  async logAll(@Req() req: Request, @Body() body: any, @Query() query: any) {
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

  @Post('on-track/:geofenceName')
  async onTrack(@Param('geofenceName') geofenceName: string, @Body() body: any) {
    console.log('geofenceName', geofenceName, 'body', body);
    const eventoGeocerca = await this.prisma.geofenceEvent.create({
      data: { name: geofenceName, payload: body },
    });
    return eventoGeocerca;
  }
}
