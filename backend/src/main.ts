import { Logger } from '@nestjs/common';
import { createApp } from './bootstrap';

async function bootstrap() {
  const app = await createApp();
  const logger = new Logger('Bootstrap');

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  logger.log(`Server listening on :${port}`);
}

bootstrap();
