import { createClient } from 'redis';
import type { Logger } from 'pino';
import type { RedisLike } from './types';

export async function connectRedis(redisUrl: string, logger: Logger): Promise<RedisLike> {
  const client = createClient({ url: redisUrl });

  client.on('error', (error) => {
    logger.error({ err: error }, 'redis_error');
  });

  await client.connect();
  return client as unknown as RedisLike;
}
