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
  /** Saytın ictimai ünvanı — mektublardakı linklər (təsdiq, parol sıfırlama) bundan qurulur. */
  publicUrl: string;
  mail: {
    /** `resend` | `console`. Boş/naməlum dəyər → console (heç vaxt çökmür). */
    provider: string;
    apiKey: string;
    /** Göndərən: «360tap.az <no-reply@360tap.az>». Domen Resend-də təsdiqlənməlidir. */
    from: string;
  };
  sms: {
    /** `twilio` | `http` (lokal AZ aqreqator) | `console`. */
    provider: string;
    /** Twilio */
    accountSid: string;
    authToken: string;
    /** Twilio göndərən nömrə VƏ YA lokal aqreqatorda təsdiqlənmiş alfa-nömrə. */
    from: string;
    /** Lokal aqreqator üçün ümumi HTTP adapteri */
    httpUrl: string;
    httpToken: string;
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
    // `.trim()` MƏCBURİDİR: "a, b" kimi boşluqlu siyahıda ikinci origin " https://..."
    // olurdu və heç bir sorğuya uyğun gəlmirdi — səhv səssiz idi (CORS bloku kimi görünürdü).
    // `.filter(Boolean)` sondakı vergüldən yaranan boş sətri atır.
    // Fallback saxlanılır, amma praktikada əlçatmazdır: env.validation.ts CORS_ORIGINS-i
    // məcburi edir, yəni dəyişən olmadan proses ümumiyyətlə başlamır (buna görə də
    // production-da "səssizcə localhost açılması" ssenarisi mövcud deyil).
    origins: (process.env.CORS_ORIGINS ?? 'http://localhost:5401')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
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
  publicUrl: process.env.PUBLIC_URL ?? 'https://360tap.az',
  mail: {
    provider: process.env.MAIL_PROVIDER ?? '',
    apiKey: process.env.MAIL_API_KEY ?? '',
    from: process.env.MAIL_FROM ?? '360tap.az <no-reply@360tap.az>',
  },
  sms: {
    provider: process.env.SMS_PROVIDER ?? '',
    accountSid: process.env.SMS_ACCOUNT_SID ?? '',
    authToken: process.env.SMS_AUTH_TOKEN ?? '',
    from: process.env.SMS_FROM ?? '360tap',
    httpUrl: process.env.SMS_HTTP_URL ?? '',
    httpToken: process.env.SMS_HTTP_TOKEN ?? '',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY ?? '',
    model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
    visionModel: process.env.GROQ_VISION_MODEL ?? 'meta-llama/llama-4-scout-17b-16e-instruct',
  },
});
