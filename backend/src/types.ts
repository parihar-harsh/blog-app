export type AppEnv = {
  Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
    AUTH_RATE_LIMITER?: RateLimit
    WRITE_RATE_LIMITER?: RateLimit
  }
  Variables: {
    userId: number
    requestId: string
  }
}
