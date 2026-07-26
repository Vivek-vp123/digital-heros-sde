import type { RequestContext } from './types';

declare global {
  namespace Express {
    interface Request extends RequestContext {}
  }
}

export {};
