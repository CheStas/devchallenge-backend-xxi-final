import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
const { PORT } = process.env;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'error', 'log', 'verbose', 'warn'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      disableErrorMessages: false,
      errorHttpStatusCode: 422,
    }),
  );

  Logger.log(`Starting, PORT:${PORT}`);

  await app.listen(PORT);
}
bootstrap();
