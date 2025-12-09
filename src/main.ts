import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { config } from './config';
import { obtenerZonaPorGeocerca } from './wailon/utils/geocercas';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000', config.FRONTEND_CLIENT_URL],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  const swaggerConfig = new DocumentBuilder().setTitle('Promarisco Core API').setVersion('1.0').build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const { apiReference } = await eval("import('@scalar/nestjs-api-reference')");
  app.use('/api', apiReference({ content: document }));

  await app.listen(config.PORT);
  console.log(`Server is running on port ${config.PORT}`);

  const t = obtenerZonaPorGeocerca('MARFRISCO');
  console.log(t);
}
bootstrap();
