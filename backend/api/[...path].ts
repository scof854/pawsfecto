import express from 'express';
import { createApp } from '../src/bootstrap';

const server = express();
let bootstrapped: Promise<void> | undefined;

async function bootstrap() {
  bootstrapped ??= createApp(server).then((app) => app.init()).then(() => undefined);
  return bootstrapped;
}

export default async function handler(req: any, res: any) {
  await bootstrap();
  return server(req, res);
}
