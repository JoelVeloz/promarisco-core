import { All, Body, Controller, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { transformPayload } from '../geofence-events/utils/payload-transform.utils';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly prisma: PrismaService) {}

  @All('test')
  @ApiOperation({ summary: 'Prueba webhook' })
  @ApiResponse({ status: 200 })
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
  @ApiOperation({ summary: 'Registrar evento geocerca' })
  @ApiResponse({ status: 201 })
  async onTrack(@Param('geofenceName') geofenceName: string, @Body() body: any) {
    const eventoGeocerca = await this.prisma.geofenceEvent.create({
      data: { name: geofenceName, payload: body },
    });

    try {
      const transformed = transformPayload(body);
      return await this.prisma.geofenceEvent.update({
        where: { id: eventoGeocerca.id },
        data: { transformed: transformed as any },
      });
    } catch (error) {
      console.error('Error actualizando transformed:', error);
      return eventoGeocerca;
    }
  }
}
