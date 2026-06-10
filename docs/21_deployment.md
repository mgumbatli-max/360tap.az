# 21 — Deployment Plan

## A. Mühitlər (Environments)

| Mühit | URL | Cluster | DB | İcazə |
|---|---|---|---|---|
| **Local** | localhost | docker-compose | local pg | developer |
| **Dev** | dev.platform.az | shared k8s dev | dev pg | tüm dev |
| **Staging** | staging.platform.az | k8s staging | staging pg | dev + QA |
| **Pre-prod** | preprod.platform.az | k8s pre-prod | prod-mirror pg | senior + ops |
| **Production** | platform.az | k8s prod (multi-AZ) | prod pg primary + replicas | ops only |

## B. Cluster topologiyası (Production)

```
┌─────────────────────────────────────────────────────────────┐
│                  Cloudflare (DNS, CDN, WAF, DDoS)           │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│        Kubernetes Cluster (3 AZ, 9 worker nodes)            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Ingress (Nginx / Traefik)                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌────────────┬────────────┬────────────┬─────────────┐    │
│  │  web pods  │ admin pods │  api pods  │ worker pods │    │
│  │  (3 replicas)│ (2)      │ (5)        │ (4)         │    │
│  └────────────┴────────────┴────────────┴─────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Managed Services (Cloud)                       │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Postgres │  Redis   │Meilisearc│   S3     │ Cloudflare│ │
│  │ Primary +│ Cluster  │ Cluster  │ R2       │ R2 (back) │ │
│  │ 2 read   │ 3 nodes  │ 3 nodes  │          │           │ │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Observability                                  │
│  Prometheus · Grafana · Loki · Tempo · Sentry · Posthog    │
└─────────────────────────────────────────────────────────────┘
```

### Resurslər (production)

| Pod | CPU req/lim | Memory req/lim | Replicas | HPA |
|---|---|---|---|---|
| web | 500m / 1 | 512Mi / 1Gi | 3 | 3-10 (CPU 70%) |
| admin | 250m / 500m | 256Mi / 512Mi | 2 | 2-4 |
| api | 500m / 1 | 512Mi / 1Gi | 5 | 5-20 (CPU 70%) |
| worker | 250m / 500m | 512Mi / 1Gi | 4 | 4-12 (queue depth) |

## C. CI/CD pipeline

```
┌─────────────────────────────────────────────────────────┐
│   1. PR açılır                                         │
│      └─ Lint + Type-check + Unit test (parallel)       │
│                  ↓                                      │
│   2. Integration + Security scan                        │
│                  ↓                                      │
│   3. Build images (api, web, admin, worker)            │
│                  ↓                                      │
│   4. Push to registry (ghcr.io / ECR)                  │
│                  ↓                                      │
│   5. PR review + approval                              │
│                  ↓                                      │
│   6. Merge to main                                     │
│      └─ Auto deploy to dev (ArgoCD)                    │
│                  ↓                                      │
│   7. E2E tests on dev                                  │
│                  ↓                                      │
│   8. Auto promote to staging                           │
│                  ↓                                      │
│   9. QA + smoke test                                   │
│                  ↓                                      │
│   10. Manual approval → pre-prod                       │
│                  ↓                                      │
│   11. Canary deploy to prod (5% trafik)                │
│      └─ 30 dəq monitor: error rate, latency            │
│                  ↓                                      │
│   12. Auto promote to 100% (yaxud rollback)            │
└─────────────────────────────────────────────────────────┘
```

### GitHub Actions workflow nümunəsi

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [api, web, admin, worker]
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          file: infra/docker/${{ matrix.service }}.Dockerfile
          push: true
          tags: |
            ghcr.io/avito-az/${{ matrix.service }}:${{ github.sha }}
            ghcr.io/avito-az/${{ matrix.service }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-dev:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Update ArgoCD app
        run: |
          argocd app sync platform-dev \
            --revision ${{ github.sha }}
```

### ArgoCD GitOps

```
Git repo: platform-az/k8s-manifests
├── apps/
│   ├── api/
│   │   └── kustomization.yaml
│   ├── web/
│   ├── admin/
│   └── worker/
└── overlays/
    ├── dev/
    ├── staging/
    └── prod/

Workflow:
- CI build → image tag yenilənir
- Bot kustomization.yaml-ı yeniləyir (PR)
- Auto-merge dev üçün
- Manual merge prod üçün
- ArgoCD detect → cluster-ə tətbiq
```

## D. Deploy strategiyaları

### Dev: Auto rolling update
- 100% replica yenilənmə
- Downtime: yox

### Staging: Auto rolling
- Eyni dev kimi
- Smoke testdən sonra

### Pre-prod: Blue-green
- Yeni versiya parallel ayağa qalxır (green)
- Trafik 0 → 100% manual switch
- 24 saat monitor (rollback hazır)

### Prod: Canary deploy
```
Step 1: 5% trafik → yeni versiya (30 dəq)
       ├─ Error rate < 0.5%
       ├─ P99 latency < 500ms
       └─ Auto rollback olarsa fail

Step 2: 25% (30 dəq)
Step 3: 50% (60 dəq)
Step 4: 100%
```

### Rollback
- ArgoCD: `argocd app rollback platform-prod --to <revision>`
- 5 dəq ərzində reverse
- DB migrasiya rollback safe (additive only — sxem aşağı baxımda)

## E. Database miqrasiya strategiyası

### Qızıl qaydalar
1. **Heç vaxt** mövcud sütunu drop etmə birinci deploy-da
2. **Heç vaxt** rename etmə (yeni sütun + dual write + drop)
3. **Hər zaman** additive migration (yeni cədvəl, yeni sütun nullable)
4. **NOT NULL** sütun: 3 mərhələli (add nullable + backfill + alter not-null)

### Misal — sütun rename
```
Sprint 1: ADD COLUMN new_name (sxem dəyişikliyi)
          App writes BOTH old_name and new_name (dual write)
Sprint 2: Backfill: UPDATE table SET new_name = old_name WHERE new_name IS NULL
          App reads new_name (fallback to old_name)
Sprint 3: App reads only new_name
Sprint 4: DROP COLUMN old_name
```

### Migration tooling
- Prisma Migrate (dev), Prisma Migrate Deploy (prod)
- Hər migration review olunur
- Pre-prod-da test edilir
- Prod-da maintenance window-da (gərək olarsa)

## F. Backup və Disaster Recovery

### Backup
- **Postgres:**
  - Continuous WAL archiving (S3, hər 5 dəq)
  - Daily full snapshot (saat 03:00 UTC, 30 gün saxlama)
  - Weekly snapshot (90 gün saxlama)
  - Monthly snapshot (1 il saxlama)
  - Point-in-Time Recovery (PITR) imkanı
- **S3:**
  - Cross-region replication (R2 → AWS S3 us-east-1)
  - Versioning aktiv (90 gün)
- **Redis:**
  - RDB snapshot 1 saat
  - AOF append-only file

### RPO / RTO hədəfləri
- **RPO** ≤ 15 dəq
- **RTO** ≤ 1 saat (kritik servislər)
- **RTO** ≤ 4 saat (tam sistem)

### DR Runbook
1. **Failover trigger** — primary AZ dropped
2. **Activate DR cluster** — başqa region-da hazır mode
3. **DNS switch** — Cloudflare CNAME yenilənmə (TTL 60s)
4. **Database restore** — son snapshot + WAL replay
5. **Smoke test** — kritik flow yoxla
6. **Status page update**
7. **Post-mortem**

### DR təcrübə (drill)
- Hər kvartal
- Sənədlər yenilənir
- Komanda hazırlığı

## G. Monitoring və alerting

### Metrik kateqoriyaları (RED + USE)

**RED (request)**
- Rate (RPS)
- Errors (rate, %)
- Duration (P50, P95, P99)

**USE (resource)**
- Utilization (CPU, Memory)
- Saturation (queue depth)
- Errors (OOM, restart)

### Dashboard (Grafana)
- Overview — bütün servislər
- API hər endpoint
- DB query analyzer
- Cache hit rate
- Worker queue
- WebSocket connections
- Frontend Core Web Vitals

### Alert qaydaları (Prometheus AlertManager)

```yaml
- alert: APIErrorRateHigh
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 5m
  severity: critical
  receiver: pagerduty

- alert: DatabaseConnectionsExhausted
  expr: pg_stat_activity_count > 95
  for: 2m
  severity: critical

- alert: WorkerQueueBacklog
  expr: bullmq_queue_depth > 10000
  for: 10m
  severity: warning

- alert: PaymentSuccessRateLow
  expr: rate(payment_status{status="succeeded"}[15m]) / rate(payment_status[15m]) < 0.9
  for: 15m
  severity: critical

- alert: SearchLatencyHigh
  expr: histogram_quantile(0.95, search_duration_bucket) > 0.5
  for: 10m
  severity: warning
```

### Alert kanal
- **Critical** → PagerDuty + Slack #incidents
- **Warning** → Slack #ops
- **Info** → Slack #monitoring

### On-call rotasiya
- 7 günlük rotation
- Primary + backup
- Escalation 15 dəq cavab yoxdursa

## H. Logs

### Structured logging
```json
{
  "timestamp": "2026-05-08T10:23:00Z",
  "level": "info",
  "service": "api",
  "trace_id": "abc-123",
  "span_id": "...",
  "user_id": "...",
  "method": "POST",
  "path": "/listings",
  "status": 201,
  "duration_ms": 142,
  "msg": "Listing created"
}
```

### Pipeline
```
App stdout → Filebeat → Loki → Grafana
            → Sentry (error)
            → ClickHouse (analytics events)
```

### Retention
- Application logs: 30 gün
- Audit logs: 1 il
- Security logs: 1 il (sıxılmış)

## I. Secrets management

- **Vault** (HashiCorp) və ya **AWS Secrets Manager**
- Heç vaxt repo-da plaintext
- ENV variable injection at deploy time
- Sirr rotasiya kvartalda
- Audit log: kim, nə zaman secret istəyib

## J. Cost optimization

| Strategiya | Təxmini qənaət |
|---|---|
| Reserved instance (DB, Redis) | 30-40% |
| Spot instance (worker) | 60-70% |
| S3 lifecycle (archive 90 gün) | 50% storage |
| Cloudflare R2 (no egress) | 80% bandwidth |
| HPA right-sizing | 20-30% compute |
| Image optimization (imgproxy) | 70% bandwidth |

## K. SLA (Service Level Agreement)

### Public SLA
- Uptime: 99.9% (≈ 8.76 saat/il downtime)
- API P99: 500ms

### Internal SLO
- Uptime: 99.95% (~ 4.4 saat)
- Mean Time to Recovery (MTTR): 30 dəq
- Mean Time Between Failures (MTBF): > 30 gün

## L. Status page

- statuspage.io / openstatus
- Real-time component statuses
- Incident history
- Subscription (email, RSS, webhook)
- Incident communication template

## M. Disaster Recovery Plan (DRP)

### Tier 1 — Service degraded
- Auto-failover (HA): 0-30 san downtime
- Komandaya bildiriş

### Tier 2 — Single AZ failure
- Multi-AZ → digər AZ-yə cəld
- 5-15 dəq downtime
- DNS update

### Tier 3 — Full region failure
- DR runbook tətbiq
- 1-4 saat downtime
- Status page update
- Müştəri kommunikasiyası

### Tier 4 — Data loss
- PITR + WAL replay
- 5-30 dəq RPO
- Post-mortem məcburi

## N. Compliance & audit

- **SOC 2** (gələcək) — proseslər hazır olmalıdır
- **ISO 27001** (Faza 4) — sertifikatlaşma
- **PCI DSS** — ödəniş scope-u
- **KMQ** (Azərbaycan) — Day 1
- **GDPR-uyğun** (xarici istifadəçilər üçün)

### Audit hazırlığı
- Bütün dəyişikliklər audit log-da
- Erişim review aylıq
- Log retention 1 il
- Backup test logu

## O. Production checklist (launch öncəsi)

- [ ] Penetration test keçildi (kritik/yüksək yox)
- [ ] Yük testi P99 hədəfdə
- [ ] DB backup + restore test edilib
- [ ] DR drill keçirilib
- [ ] Runbook-lar dərc edilib
- [ ] On-call rotation aktiv
- [ ] Status page hazır
- [ ] Monitoring dashboard tam
- [ ] Alert routing yoxlanıb
- [ ] Secret rotation prosesi
- [ ] SSL sertifikatları + auto-renewal
- [ ] Cookie banner + privacy policy
- [ ] Terms of service hüquqşünas review-dən keçib
- [ ] DNS hazır + DNSSEC
- [ ] Cloudflare WAF qaydalar tənzim olunub
- [ ] Domain DMARC/SPF/DKIM aktiv
- [ ] Customer support training
- [ ] Marketing launch coordinated

## P. Post-launch operations (Day 1 → Day 30)

### Day 1
- "War room" 24/7 monitor
- Hər saat status update
- Bug priority triage

### Week 1
- Daily standup
- Hər PR sürətli review
- Hot fix branch active

### Week 2-4
- Normal operasiya
- Weekly review
- Tech debt sprint planning

### Day 30
- Post-launch retro
- Lessons learned
- Roadmap re-prioritization
