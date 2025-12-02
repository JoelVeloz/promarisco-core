import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { config } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      skipMissingProperties: true,
      skipNullProperties: true,
      skipUndefinedProperties: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder().setTitle('Promarisco Core API').setVersion('1.0').build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Usar dynamic import para Scalar (compatible con CommonJS y módulos ES)
  const { apiReference } = await import('@scalar/nestjs-api-reference');
  app.use('/api', apiReference({ content: document }));

  await app.listen(config.PORT);
  console.log(`Server is running on port ${config.PORT}`);
}
bootstrap();
