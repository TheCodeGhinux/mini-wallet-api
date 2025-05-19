/* eslint-disable no-constant-binary-expression */
export default () => ({
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 2001,
  app: { name: process.env.APP_NAME, slug: process.env.APP_SLUG },
  database: {
    url: process.env.DATABASE_URL,
    enableTransactions: process.env.ENABLE_MONGODB_TRANSACTIONS === "true",
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL,
  },
  uiUrl: process.env.UI_URL,
  hostUrl: process.env.HOST_URL,
  grafana: {
    lokiHost: process.env.GRAFANA_LOKI_HOST,
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
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || "0", 10),
    tls: process.env.REDIS_TLS === "true",
  },
  aws: {
    region: process.env.AWS_REGION,
    s3AccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    s3SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.AWS_S3_BUCKET,
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    baseUrl: process.env.PAYSTACK_BASE_URL,
  },
  cron: {
    enabled: process.env.CRON_ENABLED === "true",
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
