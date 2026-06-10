# 20 — Test Plan

## A. Test piramidası

```
                    ┌──────────────┐
                    │   E2E (5%)   │     ~50 ssenari
                    │  Playwright  │     yavaş, kritik flow
                    └──────────────┘
                ┌──────────────────────┐
                │ Integration (15%)    │   ~300 test
                │ NestJS + Testcontainers│  modul + DB
                └──────────────────────┘
            ┌──────────────────────────────┐
            │     Unit tests (80%)         │ ~3000 test
            │  Vitest / Jest               │ sürətli
            └──────────────────────────────┘
```

## B. Test növləri və əhatə hədəfləri

| Növ | Alət | Əhatə hədəfi |
|---|---|---|
| Unit | Vitest (FE) / Jest (BE) | ≥ 80% statement |
| Integration | Vitest + Testcontainers | ≥ 70% kritik yolda |
| Contract | Pact / OpenAPI | 100% public API |
| E2E web | Playwright | Top 50 ssenari |
| E2E mobile (PWA) | Playwright mobile | Top 20 ssenari |
| Visual regression | Chromatic / Percy | Bütün UI komponent |
| Accessibility | axe-core, Pa11y | WCAG AA, ≥ 95 |
| Performance | Lighthouse CI | ≥ 90 |
| Load | k6 | RPS hədəfləri |
| Security | OWASP ZAP, Snyk | OWASP Top 10 |
| Mutation | Stryker | ≥ 70% killed |
| Penetration | 3rd party | illik |

## C. Unit testlər

### Backend (NestJS)
```typescript
// listings.service.spec.ts
describe('ListingsService', () => {
  let service: ListingsService;
  let repo: MockType<ListingsRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: ListingsRepository, useFactory: mockRepository },
      ],
    }).compile();
    service = module.get(ListingsService);
    repo = module.get(ListingsRepository);
  });

  describe('create', () => {
    it('avtomatik slug yaradır', async () => {
      repo.create.mockResolvedValue({ id: 'x', slug: 'iphone-15-pro' });
      const result = await service.create('user1', {
        title: 'iPhone 15 Pro', categoryId: 'c1', description: 'test',
      });
      expect(result.slug).toMatch(/^iphone-15-pro/);
    });

    it('status review-də yaradır', async () => {
      const r = await service.create('user1', validInput);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'review' })
      );
    });

    it('5-dən az simvol başlığı rejection edir', async () => {
      await expect(service.create('user1', { ...validInput, title: 'abc' }))
        .rejects.toThrow(BadRequestException);
    });
  });
});
```

### Frontend (Vitest + Testing Library)
```typescript
// ListingCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ListingCard } from './ListingCard';

const mockListing = {
  id: '1', title: 'iPhone', price: 1500, currency: 'AZN',
  is_vip: true, media: [{ url: '/test.jpg' }], ...
};

test('VIP rozetini göstərir', () => {
  render(<ListingCard item={mockListing} />);
  expect(screen.getByText(/VIP/i)).toBeInTheDocument();
});

test('qiymət düzgün format edilir', () => {
  render(<ListingCard item={mockListing} />);
  expect(screen.getByText('1 500 AZN')).toBeInTheDocument();
});
```

## D. Integration testlər

```typescript
// listings.integration.spec.ts (Testcontainers ilə)
beforeAll(async () => {
  postgresContainer = await new PostgreSqlContainer().start();
  redisContainer = await new RedisContainer().start();
  meiliContainer = await new GenericContainer('getmeili/meilisearch').start();
  
  app = await NestFactory.create(AppModule);
  await app.init();
});

test('Elan yaradılır → search index yenilənir → tapılır', async () => {
  // 1. Yarat
  const listing = await request(app.getHttpServer())
    .post('/listings')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Test elan iPhone', ... })
    .expect(201);

  // 2. Indexer worker işləməsi üçün gözlə
  await waitFor(async () => {
    const r = await request(app.getHttpServer())
      .get(`/search?q=iphone`)
      .expect(200);
    expect(r.body.items).toContainEqual(
      expect.objectContaining({ id: listing.body.id })
    );
  }, { timeout: 5000 });
});
```

## E. E2E test ssenariləri (Playwright)

### Top 50 kritik ssenari (MVP)

#### Auth (5)
1. Yeni istifadəçi qeydiyyat → email təsdiq → ilk daxil olma
2. Telefon + OTP qeydiyyat
3. Google OAuth login
4. Parol bərpa
5. Logout

#### Listing creation (10)
6. 8-addımlı wizard tam keçid
7. Şəkil yükləmə (5 şəkil) və sıralama
8. Kateqoriya cascade (3 səviyyə)
9. Dinamik atribut (avtomobil)
10. Qaralama saxlama və davam etdirmə
11. Wizard ortasında validation səhvləri
12. Şəkil ölçüsü çox böyükdürsə xəta
13. Kateqoriya dəyişdirmə → atributlar reset
14. Maks 20 şəkil limiti
15. Çıxış → wizard saxlanılır

#### Search (8)
16. Mətn axtarış
17. Kateqoriya filter
18. Şəhər filter
19. Qiymət range filter
20. Sıralama dəyişmə
21. Cursor pagination
22. Saxlanılan axtarış
23. Boş nəticə UI

#### Listing detail (5)
24. Şəkil qalereyası swipe
25. Telefon klikləməsi → tracking
26. Sevimliyə əlavə (auth required)
27. Şikayət göndərmə
28. Oxşar elanlar

#### Chat (5)
29. Yeni chat başlatma
30. Real-time mesaj göndərmə
31. Şəkil göndərmə chat-də
32. Görüldü statusu
33. Bloklama

#### Personal cabinet (4)
34. Mənim elanlarım siyahı
35. Elan redaktə
36. Elan satılıb işarə
37. Profil ayarları redaktə

#### Payment (5)
38. Boost ödəniş tam axın
39. Sandbox kart ilə uğurlu
40. Sandbox kart ilə uğursuz
41. Webhook signature yoxlama
42. Refund (admin tərəfindən)

#### Admin (5)
43. Admin login + 2FA
44. Elan moderasiya təsdiq
45. Elan moderasiya rədd
46. İstifadəçi suspend
47. Şikayət resolve

#### PWA (3)
48. Offline rejim cache
49. "Ana ekrana əlavə et" prompt
50. Push notification (web)

### Misal kod
```typescript
// e2e/listing-creation.spec.ts
test('İstifadəçi 8-addımlı wizard ilə elan yaratdı', async ({ page }) => {
  await loginAs(page, 'test-user');
  
  await page.goto('/elan-yerlesdir');
  
  // Step 1: Kateqoriya
  await page.click('[data-test="cat-elektronika"]');
  await page.click('[data-test="cat-telefon"]');
  
  // Step 2: Məlumat
  await page.fill('[name="title"]', 'iPhone 15 Pro Max');
  await page.fill('[name="description"]', 'Yaxşı vəziyyətdə '.repeat(10));
  await page.click('[data-test="next"]');
  
  // Step 3: Atribut
  await page.selectOption('[name="brand"]', 'Apple');
  await page.fill('[name="storage"]', '256');
  await page.click('[data-test="next"]');
  
  // Step 4: Qiymət
  await page.fill('[name="price"]', '1500');
  await page.click('[data-test="next"]');
  
  // Step 5: Şəkil
  await page.setInputFiles('input[type="file"]', './fixtures/iphone.jpg');
  await page.waitForSelector('[data-test="image-uploaded"]');
  await page.click('[data-test="next"]');
  
  // Step 6: Şəhər
  await page.selectOption('[name="city"]', 'baki');
  await page.click('[data-test="next"]');
  
  // Step 7: Əlaqə
  await page.fill('[name="contact_phone"]', '+994501234567');
  await page.click('[data-test="next"]');
  
  // Step 8: Promotion (skip)
  await page.click('[data-test="skip-promotion"]');
  
  // Step 9: Onay
  await expect(page.locator('h2')).toContainText('iPhone 15 Pro Max');
  await page.click('[data-test="publish"]');
  
  // Uğur
  await expect(page).toHaveURL(/\/ugur\//);
  await expect(page.locator('.toast')).toContainText('moderasiyaya');
});
```

## F. Performance test (k6)

### Ssenari 1 — Spike test
```javascript
// k6/spike.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // ramp-up
    { duration: '1m', target: 1000 },  // spike
    { duration: '3m', target: 1000 },  // sustain
    { duration: '1m', target: 0 },     // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed:   ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('https://api.staging.../api/listings?category=telefon');
  check(res, {
    'status 200': (r) => r.status === 200,
    'has items':  (r) => r.json('items').length > 0,
  });
  sleep(1);
}
```

### Ssenari 2 — Realistic load (60 dəq)
- 60% search, 20% listing detail, 10% favorite, 5% chat, 5% post
- 500 concurrent users
- Hədəf: bütün threshold-lar yaşıl

### Ssenari 3 — Search heavy
- 100% search trafiki
- 2000 RPS hədəf
- Meilisearch + cache məhsuldarlıq

### Ssenari 4 — WebSocket scale
- 10K paralel connection
- Hər 5 saniyədə 1 mesaj
- Memory + CPU monitoring

## G. Visual regression (Chromatic)

- Hər PR-də Storybook build
- Diff göstərilir, manual onay
- Cycle:
  - Component dəyişiklik → Storybook story yenilənir
  - Chromatic snapshot diff
  - Reviewer bu dəyişikliyi qəbul edir və ya rədd

## H. Accessibility test

```bash
npm run a11y           # axe-core CLI
npm run a11y:ci        # CI-də
```

Hər səhifə üçün:
- WCAG AA uyğunluğu
- Klaviatura naviqasiyası
- ARIA labels
- Kontrast oranları
- Screen reader (VoiceOver/NVDA manual)

```typescript
// playwright + axe
test('Ana səhifə a11y', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

## I. Security test

### Otomatik
- **Snyk** — dependency vulnerabilities (PR-də)
- **Trivy** — container scan
- **OWASP ZAP** — staging-də həftəlik
- **Semgrep** — kod static analiz (PR-də)

### Manual
- Hər kvartalda penetration test (3rd party)
- Bug bounty proqramı (HackerOne / öz)
- Threat modeling (yeni feature üçün)

### OWASP Top 10 checklist
- A01 Broken Access Control — RBAC test, IDOR
- A02 Cryptographic Failures — TLS, hashing
- A03 Injection — SQL, NoSQL, command
- A04 Insecure Design — threat model
- A05 Security Misconfiguration — header, cors
- A06 Vulnerable Components — Snyk
- A07 Auth Failures — session, password
- A08 Software/Data Integrity — sign, verify
- A09 Logging Failures — audit log
- A10 SSRF — outbound URL allowlist

## J. Test data

### Fixtures
```
tests/fixtures/
├── users.json          # 50 user
├── categories.json     # tam ağac
├── cities.json         # 12 şəhər
├── listings.json       # 200 elan
├── images/             # test şəkilləri
└── factory/            # data factory funksiyaları
    ├── user.factory.ts
    ├── listing.factory.ts
    └── ...
```

### Database seed (test)
```typescript
// tests/setup.ts
beforeAll(async () => {
  await db.$executeRaw`TRUNCATE listings, users, ... CASCADE`;
  await seedFromFixtures();
});
```

## K. CI/CD test pipeline

```yaml
# .github/workflows/test.yml
name: Test
on: [pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm lint

  type-check:
    needs: lint
    steps: ... pnpm type-check

  test-unit:
    needs: lint
    steps: ... pnpm test:unit -- --coverage
    # Codecov upload

  test-integration:
    services:
      postgres: { image: postgres:16, ... }
      redis:    { image: redis:7, ... }
    steps: ... pnpm test:integration

  test-e2e:
    needs: [test-unit, test-integration]
    steps:
      - run: docker compose up -d
      - run: pnpm db:migrate && pnpm db:seed
      - run: pnpm test:e2e
      - upload: playwright-report/

  security:
    steps:
      - run: pnpm audit
      - run: docker run snyk/snyk
      - run: docker run aquasec/trivy

  build:
    needs: [test-e2e, security]
    steps: ... pnpm build
```

### Quality gates
- Lint, type-check, unit test → block merge
- Integration test → block merge
- Coverage drop > 2% → block
- E2E top 10 critical → block
- Security high/critical → block

## L. Test mühitləri

| Mühit | Məqsəd | Veriliş yolu |
|---|---|---|
| **dev** | individual developer | localhost / docker compose |
| **staging** | QA, integration | k8s staging cluster, prod mirror |
| **pre-prod** | son təsdiq | k8s, real prod data (PII masked) |
| **prod** | live | multi-AZ |

### Veri sinxron
- Anonim production veri → staging (gündəlik snapshot, PII maskalanır)
- Schema dəyişiklikləri əvvəl staging-də test

## M. Bug tracking və test reportu

- Jira / Linear
- Hər bug: severity (P0-P4), reproduce steps, expected/actual
- Test report dashboard:
  - Pass rate trend
  - Flaky tests list (auto-quarantine)
  - Coverage trend
  - Lighthouse trend

## N. Test çırağı (test heuristics)

- **Equivalence partitioning** — eyni davranış sinifləri
- **Boundary value** — limit yoxlamaları (max title, min price)
- **Decision table** — kompleks rules
- **State transition** — listing status flow
- **Pairwise** — combinatorial filterlər
- **Negative testing** — invalid input
- **Exploratory** — sənədsiz axtarış

## O. Definition of Done (test perspektivindən)

Hər feature üçün:
- [ ] Unit test yazılıb (≥ 80% coverage)
- [ ] Integration test yazılıb (kritik yol)
- [ ] E2E test yazılıb (əsas user flow)
- [ ] Storybook story yenilənib
- [ ] Visual regression keçib
- [ ] A11y validation
- [ ] Manuel QA staging-də
- [ ] Security review (sensitive feature)
- [ ] Performance check (yoxlanmış: queries, bundle size)
