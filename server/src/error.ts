export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function toErrorResponse(error: unknown, requestId: string) {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: {
        requestId,
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null
        }
      }
    };
  }

  return {
    statusCode: 500,
    body: {
      requestId,
      error: {
        code: 'internal_error',
        message: 'An unexpected error occurred.',
        details: null
      }
    }
  };
}
