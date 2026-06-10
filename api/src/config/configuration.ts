export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  cors: {
    origins: string[];
  };
  jwt: {
    secret: string;
    accessTtl: number;
    refreshTtl: number;
  };
  throttle: {
    ttl: number;
    limit: number;
  };
  redisUrl: string;
  meili: {
    host: string;
    key: string;
  };
  media: {
    dir: string;
    baseUrl: string;
  };
  groq: {
    apiKey: string;
    model: string;
    visionModel: string;
  };
}

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`${key} environment variable is required`);
  return v;
}

export default (): AppConfig => ({
  nodeEnv: (process.env.NODE_ENV as AppConfig['nodeEnv']) ?? 'development',
  port: parseInt(process.env.PORT ?? '5500', 10),
  cors: {
    origins: (process.env.CORS_ORIGINS ?? 'http://localhost:5401').split(','),
  },
  jwt: {
    secret: required('JWT_SECRET'),
    accessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10),
    refreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '604800', 10),
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '300', 10),
  },
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  meili: {
    host: process.env.MEILI_HOST ?? 'http://localhost:7700',
    key: process.env.MEILI_KEY ?? '',
  },
  media: {
    dir: process.env.MEDIA_DIR ?? './uploads',
    baseUrl: process.env.MEDIA_BASE_URL ?? 'http://localhost:5500/uploads',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY ?? '',
    model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
    visionModel: process.env.GROQ_VISION_MODEL ?? 'meta-llama/llama-4-scout-17b-16e-instruct',
  },
});
