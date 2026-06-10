# 15 — Payment Flow

## A. Ödəniş arxitekturası

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (Web / Mobile)                    │
└──────────────────────┬──────────────────────────────────┘
                       │ POST /payments/create
                       ▼
┌─────────────────────────────────────────────────────────┐
│              PaymentsService                            │
│  1. Validate amount, idempotency-key                    │
│  2. Create Payment row (status='pending')               │
│  3. Call provider (Pulpal/Epoint)                       │
│  4. Return redirect_url and provider_ref                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Pulpal / Epoint hosted page                │
│  3D Secure flow                                         │
└──────────────────────┬──────────────────────────────────┘
                       │ webhook
                       ▼
┌─────────────────────────────────────────────────────────┐
│              POST /payments/webhook/:provider           │
│  1. Verify signature                                    │
│  2. Idempotent processing (provider_ref)                │
│  3. Update Payment status                               │
│  4. Apply business action (promotion / wallet topup)    │
│  5. Emit "payment.succeeded" event                      │
└─────────────────────────────────────────────────────────┘
```

## B. 3 əsas ödəniş ssenarisi

### B.1. Pay-as-you-go (məs. "Yuxarı qaldır" 1₼)

```
[Listing detal] → "Yuxarı qaldır" düyməsi
   ↓
[Modal: Paket seç + ödəmə üsulu]
   - Balansdan (kifayətdirsə default)
   - Yaxud kartla (gedir Pulpal-a)
   ↓ Confirm
   POST /listings/:id/promote { service_code: "boost", payment_method: "card" }
   ↓
   PaymentsService:
     1. Idempotency-Key yoxla (24 saatlıq)
     2. Payment row yarat:
          { user_id, listing_id, amount: 1.00, currency: AZN,
            type: 'promotion', status: 'pending',
            metadata: { service_code: 'boost' } }
     3. Provider call:
          POST pulpal.az/api/charge
            { amount, order_id: payment.id,
              description: "Avito.az: Boost",
              callback_url: api.avito.az/payments/webhook/pulpal }
     4. Return { redirect_url }
   ↓
[Pulpal səhifəsi] → kart məlumatı + 3DS
   ↓ Uğur
[Webhook /payments/webhook/pulpal]
     1. signature verify (HMAC SHA256)
     2. Payment.status = 'succeeded', paid_at = now
     3. PromotionsService.apply(listing_id, 'boost')
        - listing.bumped_at = now (search yenidən sıralayır)
        - listing.is_highlight = false (boost-da rəng dəyişmir)
        - 1 dəfəlik effekt
     4. Emit "payment.succeeded"
        ├─ Notification: "Elanınız yuxarı qaldırıldı"
        ├─ Wallet log
        └─ Analytics
   ↓
[Geri /elanlar/:id?promotion=success]
   Toast: "Boost aktivləşdi ✓"
```

### B.2. Balans artırma (Top-up)

```
[/kabinet/balans] → "Balansa pul artır"
   ↓
[Modal]
   - Məbləğ: 10 / 25 / 50 / 100 / custom
   - Ödəmə üsulu: kart / Apple Pay / Google Pay
   ↓ Confirm
   POST /payments/topup { amount: 50 }
   ↓ Provider redirect → 3DS → callback
   ↓
[Webhook]
   1. Payment.status = 'succeeded'
   2. WalletService.credit(user_id, 50, 'topup', payment_id)
      - INSERT wallet_transactions { type:'credit', amount:50, balance_after:... }
      - UPDATE users SET balance = balance + 50
   3. Notification "Balansa 50 ₼ əlavə olundu"
```

### B.3. Abunəlik (Subscription)

```
[/biznes-kabinet/paketim] → "Pro paketinə yenilə"
   ↓
[Modal: Plan + müddət]
   - Pro aylıq 99 ₼
   - Pro illik 990 ₼ (~17% endirim)
   - Auto-renew toggle
   ↓ Confirm
   POST /subscriptions { plan_code: 'pro', period: 'monthly', auto_renew: true }
   ↓
   SubscriptionService:
     1. Subscription row yarat (status='pending_payment')
     2. Payment row yarat (type='subscription')
     3. Provider call (recurring token)
   ↓ Webhook → succeeded
   ↓
   1. Subscription.status = 'active', expires_at = now + 30d
   2. User.role yenilənir (business-ə)
   3. Limit ləğv edilir (paket limit qədər)
   4. Cron job (gündəlik):
      - 7 gün qalıb → email "yenilənmə yaxınlaşır"
      - 1 gün qalıb → email
      - Bitmə günü → auto-charge cəhdi
        - Uğurlu → yenilə
        - Uğursuz → 3 dəfə retry → suspend
```

## C. Refund axını

```
İstifadəçi və ya admin refund tələb edir
   ↓
Səbəb yoxlanır:
   - Səhvən ödəmə (24 saat ərzində → tam refund)
   - Premium xidmət problemi → tam və ya qismən refund
   - Mübahisəli (admin qərarı)
   ↓
Admin: POST /admin/payments/:id/refund { amount, reason }
   ↓
RefundService:
   1. Payment.status yoxla (yalnız 'succeeded' refund oluna bilər)
   2. Provider API: refund call
   3. Provider təsdiqi
   4. Payment.status = 'refunded' (və ya 'partially_refunded')
   5. WalletService.debit (əgər balansa düşmüşdüsə)
   6. Promotion-u ləğv et (əgər bağlıdırsa)
   7. Notification + email + admin_log
```

## D. Idempotency və təhlükəsizlik

### Idempotency-Key
```
Header: Idempotency-Key: <uuid>
- 24 saatlıq Redis cache (key:value = idempotency:* → response)
- Eyni key + eyni body → əvvəlki cavab
- Eyni key + fərqli body → 409 Conflict
```

### Webhook signature
```typescript
// Pulpal misal
const signature = req.headers['x-pulpal-signature'];
const computed = crypto.createHmac('sha256', PULPAL_SECRET)
  .update(req.body)
  .digest('hex');
if (signature !== computed) throw new ForbiddenException();
```

### Replay protection
- Webhook event ID-ləri Redis-də saxlanır (24 saat)
- Eyni event yenidən gəlsə, 200 OK qaytarır (lakin emal etmir)

## E. Wallet (cüzdan) məntiqi

```
Wallet = users.balance + users.bonus_balance

Hər əməliyyat → wallet_transactions sətri:
  - type: credit / debit / refund / bonus / promo_code
  - amount: + və ya -
  - reason: topup / promotion / subscription / admin_credit / referral
  - balance_after: snapshot
  - reference_id: əlaqəli payment / promotion ID

Tranzaksiya təhlükəsizliyi:
  BEGIN;
  SELECT balance FROM users WHERE id = $user FOR UPDATE;
  -- balans yoxla
  UPDATE users SET balance = balance + $amount WHERE id = $user;
  INSERT wallet_transactions (...);
  COMMIT;
```

### Bonus balansı ilə fərq
- Bonus balansı yalnız "promotion" üçün xərcləyə bilər
- Refund-a düşməz
- 90 gün sonra avtomatik ekspirasiya

## F. Promo kod

```
Admin yaradır:
  POST /admin/promo-codes
    { code: "WELCOME50", discount_percent: 50, max_uses: 1000,
      valid_from, valid_to, applicable_services: ['boost', 'vip'] }

İstifadəçi tətbiq edir:
  Çekaut səhifəsində "Promo kod" sahəsi
  POST /payments/validate-promo { code, amount, service }
  → discount_amount qaytarır
  
Real ödəniş:
  PaymentsService:
    final_amount = amount × (1 - discount/100)
    metadata.promo_code = code
    promo_code.used_count += 1
```

## G. Ödəniş statusları (state machine)

```
        ┌─────────┐
        │ pending │
        └────┬────┘
             │
   ┌─────────┼─────────┬─────────┐
   ▼         ▼         ▼         ▼
[succeeded][failed][cancelled][expired]
   │
   ▼
[refunded] / [partially_refunded]
```

Keçid qaydaları:
- pending → succeeded (webhook ilə)
- pending → failed (webhook və ya 30 dəq timeout)
- pending → cancelled (istifadəçi)
- pending → expired (60 dəq sonra)
- succeeded → refunded (admin və ya auto)

## H. Provider abstraksiyası

```typescript
interface PaymentProvider {
  id: string;  // 'pulpal' | 'epoint'
  charge(req: ChargeRequest): Promise<ChargeResponse>;
  refund(providerRef: string, amount: number): Promise<RefundResponse>;
  verifyWebhook(headers, body): boolean;
}

class PaymentsService {
  constructor(private providers: Record<string, PaymentProvider>) {}
  
  async charge(input) {
    const provider = this.selectProvider(input);  // routing logic
    return provider.charge(input);
  }
  
  selectProvider(input): PaymentProvider {
    // Failover: Pulpal sıradan çıxsa, Epoint
    // A/B test: %10 trafik Epoint-ə
    // Cost-based: aşağı komissiyalı
    return this.providers[chosen];
  }
}
```

## I. PCI DSS uyğunluq

- Heç bir kart məlumatı bizə düşmür
- Yalnız provider token saxlanır (recurring üçün)
- TLS 1.3 məcburi
- Webhook URL-i HTTPS only
- Audit log immutable (yalnız əlavə)

## J. Faktura və qəbz

```
Hər succeeded ödəniş → PDF qəbz (avtomatik):
  - Payment ID, tarix, məbləğ
  - Xidmət təsviri
  - VÖEN (sahibkar üçün)
  - QR kod (təsdiq)
- Email + /kabinet/odenisler/:id səhifəsində
- Aylıq biznes faktura (e-Qaimə Faza 3)
```

## K. Test ssenariləri (Playwright)

```typescript
test('Boost ödənişi → elan yuxarı qalxır', async ({ page }) => {
  await page.goto('/elanlar/test-listing');
  await page.click('[data-test="promote"]');
  await page.click('[data-test="service-boost"]');
  await page.click('[data-test="pay-card"]');
  
  // Pulpal sandbox redirect
  await page.waitForURL(/pulpal/);
  await page.fill('[name="cardNumber"]', '4111111111111111');
  await page.click('[type="submit"]');
  
  // 3DS sandbox
  await page.click('[data-test="3ds-confirm"]');
  
  // Geri saytda
  await page.waitForURL(/promotion=success/);
  await expect(page.locator('.toast')).toContainText('Boost aktivləşdi');
});

test('Webhook signature verify uğursuz olarsa 401', async ({ request }) => {
  const r = await request.post('/api/payments/webhook/pulpal', {
    headers: { 'x-pulpal-signature': 'invalid' },
    data: { ... },
  });
  expect(r.status()).toBe(401);
});
```

## L. Monitoring

| Metric | Threshold | Alert |
|---|---|---|
| Ödəniş success rate | < 95% | Slack #payments |
| Webhook processing P95 | > 2s | PagerDuty |
| Refund queue depth | > 50 | Email finance |
| Provider downtime | any 503 | PagerDuty + auto-failover |
| Idempotency cache miss | > 5% | Datadog |
