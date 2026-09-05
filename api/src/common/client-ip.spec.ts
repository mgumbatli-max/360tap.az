import { createHmac } from 'node:crypto';

/**
 * İMZALANMIŞ MÜŞTƏRİ IP-Sİ — TƏHLÜKƏSİZLİK TESTLƏRİ.
 *
 * NİYƏ BU TESTLƏR VACİBDİR: `clientIp()` rate limit açarını qaytarır. Əgər kənar şəxs
 * `x-client-ip` başlığını özü yazıb qəbul etdirə bilsə, hər sorğuda başqa dəyər göndərərək
 * limiti TAMAMİLƏ keçər — yəni qorumanı sıfıra endirər. Ona görə burada təkcə "düzgün
 * imza işləyir" yox, əsasən "YANLIŞ imza İŞLƏMİR" halları yoxlanılır.
 *
 * NİYƏ `jest.isolateModules`: modul yüklənəndə `TRUST_PROXY_HOPS` bir dəfə hesablanır,
 * `INTERNAL_IP_SECRET` isə hər çağırışda oxunur. Env-i dəyişən testlər üçün modulu təzə
 * yükləmək davranışı real işə salmaya uyğunlaşdırır.
 */

const SECRET = 'test-secret-1234567890';
const REAL_IP = '203.0.113.77';

type Req = {
  socket?: { remoteAddress?: string };
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
};

function loadClientIp(): (req: Req) => string {
  let fn!: (req: Req) => string;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    fn = (require('./client-ip') as typeof import('./client-ip')).clientIp;
  });
  return fn;
}

function signed(ip: string, ts: number, secret = SECRET): Record<string, string> {
  return {
    'x-client-ip': ip,
    'x-client-ip-ts': String(ts),
    'x-client-ip-sig': createHmac('sha256', secret).update(`${ip}.${ts}`).digest('hex'),
  };
}

describe('clientIp — imzalanmış müştəri IP-si', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, INTERNAL_IP_SECRET: SECRET, NODE_ENV: 'test', TRUST_PROXY: '0' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('düzgün imzalı IP-ni qəbul edir', () => {
    const clientIp = loadClientIp();
    const req: Req = {
      socket: { remoteAddress: '10.0.0.1' },
      headers: { ...signed(REAL_IP, Date.now()), 'x-forwarded-for': '1.1.1.1, 2.2.2.2' },
    };
    expect(clientIp(req)).toBe(REAL_IP);
  });

  it('YANLIŞ imzanı rədd edir — saxta IP açar ola bilməz', () => {
    const clientIp = loadClientIp();
    const req: Req = {
      socket: { remoteAddress: '10.0.0.1' },
      headers: {
        'x-client-ip': '6.6.6.6',
        'x-client-ip-ts': String(Date.now()),
        'x-client-ip-sig': 'deadbeef'.repeat(8),
      },
    };
    expect(clientIp(req)).not.toBe('6.6.6.6');
    expect(clientIp(req)).toBe('10.0.0.1');
  });

  it('BAŞQA sirrlə imzalanmış dəyəri rədd edir', () => {
    const clientIp = loadClientIp();
    const req: Req = {
      socket: { remoteAddress: '10.0.0.1' },
      headers: signed('6.6.6.6', Date.now(), 'basqa-sirr'),
    };
    expect(clientIp(req)).toBe('10.0.0.1');
  });

  it('imzasız `x-client-ip` başlığına ETİBAR ETMİR', () => {
    const clientIp = loadClientIp();
    const req: Req = {
      socket: { remoteAddress: '10.0.0.1' },
      headers: { 'x-client-ip': '6.6.6.6' },
    };
    expect(clientIp(req)).toBe('10.0.0.1');
  });

  it('köhnə imzanı (5 dəqiqədən çox) rədd edir — replay müdafiəsi', () => {
    const clientIp = loadClientIp();
    const old = Date.now() - 6 * 60 * 1000;
    const req: Req = { socket: { remoteAddress: '10.0.0.1' }, headers: signed(REAL_IP, old) };
    expect(clientIp(req)).toBe('10.0.0.1');
  });

  it('gələcək tarixli imzanı rədd edir', () => {
    const clientIp = loadClientIp();
    const future = Date.now() + 10 * 60 * 1000;
    const req: Req = { socket: { remoteAddress: '10.0.0.1' }, headers: signed(REAL_IP, future) };
    expect(clientIp(req)).toBe('10.0.0.1');
  });

  it('sirr təyin olunmayıbsa imzalı başlığı da qəbul etmir (fail-closed)', () => {
    delete process.env.INTERNAL_IP_SECRET;
    const clientIp = loadClientIp();
    const req: Req = { socket: { remoteAddress: '10.0.0.1' }, headers: signed(REAL_IP, Date.now()) };
    expect(clientIp(req)).toBe('10.0.0.1');
  });

  it('imza yoxdursa `cf-connecting-ip`-ə düşür', () => {
    const clientIp = loadClientIp();
    const req: Req = {
      socket: { remoteAddress: '10.0.0.1' },
      headers: { 'cf-connecting-ip': '198.51.100.9' },
    };
    expect(clientIp(req)).toBe('198.51.100.9');
  });

  it('imzalı IP `cf-connecting-ip`-dən ÜSTÜNDÜR', () => {
    const clientIp = loadClientIp();
    const req: Req = {
      socket: { remoteAddress: '10.0.0.1' },
      headers: { ...signed(REAL_IP, Date.now()), 'cf-connecting-ip': '198.51.100.9' },
    };
    expect(clientIp(req)).toBe(REAL_IP);
  });

  it('heç bir başlıq yoxdursa soket IP-sinə düşür', () => {
    const clientIp = loadClientIp();
    expect(clientIp({ socket: { remoteAddress: '10.0.0.1' }, headers: {} })).toBe('10.0.0.1');
  });

  it('hex olmayan imza istisna atmır, sadəcə rədd olunur', () => {
    const clientIp = loadClientIp();
    const req: Req = {
      socket: { remoteAddress: '10.0.0.1' },
      headers: {
        'x-client-ip': '6.6.6.6',
        'x-client-ip-ts': String(Date.now()),
        'x-client-ip-sig': 'bu-hex-deyil!!',
      },
    };
    expect(() => clientIp(req)).not.toThrow();
    expect(clientIp(req)).toBe('10.0.0.1');
  });
});

describe('isInternalSsrRequest — SSR imzası', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, INTERNAL_IP_SECRET: SECRET, NODE_ENV: 'test' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  function load(): (req: Req) => boolean {
    let fn!: (req: Req) => boolean;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      fn = (require('./client-ip') as typeof import('./client-ip')).isInternalSsrRequest;
    });
    return fn;
  }

  function ssrHeaders(ts: number, secret = SECRET): Record<string, string> {
    return {
      'x-internal-ssr': '1',
      'x-internal-ssr-ts': String(ts),
      'x-internal-ssr-sig': createHmac('sha256', secret).update(`ssr.${ts}`).digest('hex'),
    };
  }

  it('düzgün imzalı GET sorğusunu tanıyır', () => {
    const fn = load();
    expect(fn({ method: 'GET', headers: ssrHeaders(Date.now()) } as Req)).toBe(true);
  });

  it('metod verilməyibsə (test/kontekstsiz hal) qəbul edir', () => {
    const fn = load();
    expect(fn({ headers: ssrHeaders(Date.now()) } as Req)).toBe(true);
  });

  it('POST sorğusunu RƏDD edir — auth və yazma limitləri toxunulmaz qalmalıdır', () => {
    const fn = load();
    expect(fn({ method: 'POST', headers: ssrHeaders(Date.now()) } as Req)).toBe(false);
  });

  it('DELETE sorğusunu RƏDD edir', () => {
    const fn = load();
    expect(fn({ method: 'DELETE', headers: ssrHeaders(Date.now()) } as Req)).toBe(false);
  });

  it('yanlış imzanı RƏDD edir', () => {
    const fn = load();
    const h = ssrHeaders(Date.now());
    h['x-internal-ssr-sig'] = 'ab'.repeat(32);
    expect(fn({ method: 'GET', headers: h } as Req)).toBe(false);
  });

  it('başqa sirrlə imzalanmışı RƏDD edir', () => {
    const fn = load();
    expect(fn({ method: 'GET', headers: ssrHeaders(Date.now(), 'ozge-sirr') } as Req)).toBe(false);
  });

  it('köhnə imzanı RƏDD edir', () => {
    const fn = load();
    expect(fn({ method: 'GET', headers: ssrHeaders(Date.now() - 6 * 60 * 1000) } as Req)).toBe(false);
  });

  it('imzasız markeri RƏDD edir', () => {
    const fn = load();
    expect(fn({ method: 'GET', headers: { 'x-internal-ssr': '1' } } as Req)).toBe(false);
  });

  it('sirr yoxdursa həmişə false (fail-closed)', () => {
    delete process.env.INTERNAL_IP_SECRET;
    const fn = load();
    expect(fn({ method: 'GET', headers: ssrHeaders(Date.now()) } as Req)).toBe(false);
  });
});
