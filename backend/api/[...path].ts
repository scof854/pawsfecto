import express from 'express';
import { createApp } from '../src/bootstrap';

const server = express();
let bootstrapped: Promise<void> | undefined;

async function bootstrap() {
  bootstrapped ??= createApp(server).then((app) => app.init()).then(() => undefined);
  return bootstrapped;
}

export default async function handler(req: any, res: any) {
  if (req.url === '/' || req.url === '') {
    req.url = '/api/health';
  } else if (typeof req.url === 'string' && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }

  await bootstrap();
  return server(req, res);
}
