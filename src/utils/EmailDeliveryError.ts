export class EmailDeliveryError extends Error {
  constructor(
    public readonly recipient: string,
    public readonly type: 'verification' | 'reset-password' | 'password-changed',
    cause?: unknown,
  ) {
    super(`[Email] Gửi email "${type}" tới ${recipient} thất bại`);
    this.name = 'EmailDeliveryError';
    if (cause instanceof Error) this.cause = cause;
  }
}