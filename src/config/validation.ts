import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  API_PREFIX: Joi.string().default('api/v1'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),

  // JWT
  JWT_SECRET: Joi.string().required().min(32),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required().min(32),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Encryption
  ENCRYPTION_KEY: Joi.string().required().length(64),

  // Storage (DigitalOcean Spaces)
  DO_SPACES_KEY: Joi.string().required(),
  DO_SPACES_SECRET: Joi.string().required(),
  DO_SPACES_ENDPOINT: Joi.string().required(),
  DO_SPACES_BUCKET: Joi.string().required(),
  DO_SPACES_CDN_ENDPOINT: Joi.string().optional(),
  DO_SPACES_REGION: Joi.string().default('nyc3'),

  // Email
  RESEND_API_KEY: Joi.string().required(),
  EMAIL_FROM: Joi.string().default('CardFlow <noreply@cardflow.com>'),

  // Payments - PayPal
  PAYPAL_CLIENT_ID: Joi.string().required(),
  PAYPAL_CLIENT_SECRET: Joi.string().required(),
  PAYPAL_MODE: Joi.string().valid('sandbox', 'live').default('sandbox'),
  PAYPAL_WEBHOOK_ID: Joi.string().optional(),

  // Payments - MercadoPago
  MERCADOPAGO_ACCESS_TOKEN: Joi.string().required(),
  MERCADOPAGO_WEBHOOK_SECRET: Joi.string().optional(),

  // Frontend
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('debug'),
});

export const validationOptions = {
  allowUnknown: true,
  abortEarly: false,
};
