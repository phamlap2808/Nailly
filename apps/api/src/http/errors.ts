export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>
  ) {
    super(message)
  }
}

export function errorResponse(error: ApiError): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {})
      }
    }),
    {
      status: error.status,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}
