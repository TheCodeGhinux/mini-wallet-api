/* eslint-disable no-constant-binary-expression */
export default () => ({
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 2001,
  app: { name: process.env.APP_NAME, slug: process.env.APP_SLUG },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  throttle: {
    ttl: Number(process.env.THROTTLE_TTL) ?? 60000,
    limit: Number(process.env.THROTTLE_LIMIT) ?? 10,
  },
  cache: {
    ttl: Number(process.env.CACHE_TTL) ?? 30000,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || "0", 10),
    tls: process.env.REDIS_TLS === "true",
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    baseUrl: process.env.PAYSTACK_BASE_URL,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
  },
  isTest(): boolean {
    return process.env.NODE_ENV === "test";
  },
  isDev(): boolean {
    const env = process.env.NODE_ENV;
    const envs = ["development", "localhost", "local", "dev"];
    return !env || envs.includes(env);
  },
  isStaging(): boolean {
    return process.env.NODE_ENV === "staging";
  },
  isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  },
});
