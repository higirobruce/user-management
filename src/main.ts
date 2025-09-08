import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { createSecureServer } from 'http2';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
  //enable CORS
  app.enableCors()
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const options = {
    allowHTTP1: true,  // 👈 this allows fallback to HTTP/1.1
  };

  const server = createSecureServer(options);

  await app.init(); 

  server.on('request', app.getHttpAdapter().getInstance());

  server.listen(process.env.PORT ?? 3000, () => {
    console.log(`NestJS running with HTTP/2 (and HTTP/1.1 fallback) on https://localhost:${process.env.PORT ?? 3000}`);
  });
  // await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
