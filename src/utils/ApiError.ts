class ApiError extends Error {
  statusCode: number;
  errorCode?: string;
  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
export default ApiError;
