export const authConfig = {
  codeDigits: 6,
  codeLifetimeMs: 10 * 60 * 1000,
  resendIntervalMs: 60 * 1000,
  sendWindowMs: 60 * 60 * 1000,
  maxSendsPerWindow: 5,
  maxAttempts: 5,
  sessionLifetimeMs: 7 * 24 * 60 * 60 * 1000,
} as const;
