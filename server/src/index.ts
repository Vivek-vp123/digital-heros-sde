import { config } from './config';
import { createLogger } from './logger';
import { connectRedis } from './redis';
import { createApp } from './app';

async function main() {
  const logger = createLogger(config.nodeEnv);
  const redis = await connectRedis(config.redisUrl, logger);
  const app = createApp(config, redis, logger);

  app.listen(config.port, () => {
    logger.info({ port: config.port }, 'server_started');
  });
}

main().catch((error) => {
  console.error('Failed to start Page Pulse', error);
  process.exit(1);
});
