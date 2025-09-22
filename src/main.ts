import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { createSecureServer } from 'http2';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //enable CORS
  app.enableCors()
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('RISA service hub API Docs')
    .setDescription('API documentation for the RISA service hub')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .addApiKey({
      type: 'apiKey',
      name: 'x-api-key',
      in: 'header',
    },
      'api-key')
    // .addTag('users') // Add users tag
    // .addTag('cabinet-events') // Add cabinet events tag
    // .addTag('availability')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
