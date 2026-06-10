# 04 — Komponent strukturu

## Atomic dizayn ierarxiyası

```
atoms      → primitives (Button, Input, Icon, Badge)
molecules  → 2-3 atomdan ibarət (FormField, SearchBar)
organisms  → tam funksional (Header, ListingCard, FilterPanel)
templates  → səhifə layoutları
pages      → real səhifələr
```

## A. ATOMS (`components/ui/`)

| Komponent | Props | Notlar |
|---|---|---|
| Button | variant, size, loading, leftIcon, rightIcon | primary/ghost/outline/danger |
| IconButton | icon, label, size | ARIA label tələbli |
| Input | type, error, leftIcon, rightIcon | controlled |
| Textarea | rows, autoResize, maxLength | char counter |
| Select | options, multiple, searchable | virtual list |
| Checkbox / Radio | label, indeterminate | |
| Switch | checked, size | |
| Slider | min, max, step, dual | qiymət range |
| Badge | variant, size | status, count |
| Avatar | src, name, size, fallback | initials fallback |
| Spinner | size, color | |
| Skeleton | variant, count | listing card skeleton |
| Divider | orientation | |
| Tag | removable, color | |
| Tooltip | content, side | radix |
| Dialog / Modal | open, onClose, title | radix |
| Drawer | side, open | mobil filtr |
| Sheet | side, open | mobil chat |
| Popover | content, trigger | radix |
| DropdownMenu | items | radix |
| Tabs | items, value | radix |
| Toast | type, title, description | sonner / custom |
| Progress | value, indeterminate | |
| Stepper | steps, current | wizard üçün |
| Pagination | page, pageCount | |
| EmptyState | icon, title, description, action | |
| ErrorState | error, retry | |

## B. MOLECULES (`components/common/`)

| Komponent | Tərkib |
|---|---|
| FormField | Label + Input + Error + Hint |
| SearchBar | Input + Icon + Suggestions popover |
| PriceRange | 2 Input + Slider |
| FilePicker | Drag&drop + preview list |
| ImageUploader | FilePicker + crop + compress |
| PhoneInput | Country select + Input + format |
| DatePicker | Input + Calendar popover |
| RangeDate | 2 DatePicker |
| RatingStars | 5 ulduz, half-star |
| CopyToClipboard | Input + Copy button |
| BreadcrumbBar | Crumb[] |
| ConfirmDialog | Dialog + 2 button |
| ShareSheet | Native + WhatsApp + Telegram + link |
| LanguageSwitcher | dropdown |
| ThemeToggle | light/dark/system |

## C. LISTING DOMAIN (`components/listing/`)

| Komponent | Məsuliyyət |
|---|---|
| ListingCard | Grid card (cover, qiymət, başlıq, şəhər, premium badge) |
| ListingCardCompact | Sıralı list view |
| ListingHorizontalScroll | Premium / oxşar elanlar carousel |
| ListingGrid | Grid wrapper, masonry option |
| ListingGallery | Full-screen gallery, swipe, zoom |
| ListingMap | MapLibre cluster |
| ListingAttributes | Atribut cədvəli |
| ListingPriceHistory | Qiymət dəyişikliyi qrafiki |
| SimilarListings | Oxşar elanlar (vector search) |
| SellerCard | Avatar + reyting + "yaz/zəng" düymələri |
| FavoriteButton | toggle + animation |
| ShareButton | sheet açır |
| ReportButton | Şikayət dialog |
| ListingStatusBadge | aktiv/moderasiyada/rədd... |
| PromotionBadges | VIP, Premium, Təcili etiketləri |
| ListingSkeleton | yükləmə placeholder |
| EmptyListings | "tapılmadı" |

## D. WIZARD: Elan Yerləşdirmə (`components/post/`)

| Komponent | Addım |
|---|---|
| PostWizardLayout | Stepper + content + nav buttons |
| StepCategory | Kateqoriya seçimi (3 səviyyə cascade) |
| StepBasicInfo | Başlıq, təsvir |
| StepAttributes | Dinamik atributlar (kateqoriyaya görə) |
| StepPrice | Qiymət, valyuta, tip |
| StepImages | ImageUploader + sıralama |
| StepLocation | Şəhər, rayon, xəritə pin |
| StepContact | Telefon, chat, WhatsApp |
| StepPromotion | VIP paketləri (opsional) |
| StepPreview | Final ön baxış |
| StepSuccess | Uğur ekranı |

> Mərkəzi state: `usePostWizardStore` (Zustand persist).

## E. SEARCH & FILTER (`components/search/`)

| Komponent | Məsuliyyət |
|---|---|
| SearchHeader | İri input + suggestions |
| SearchSuggestions | Son axtarışlar + populyar |
| FilterPanel | Sidebar (desktop) / drawer (mobile) |
| FilterCategory | Kateqoriya cascade |
| FilterPrice | Range slider + manual input |
| FilterCity | City picker + radius |
| FilterCondition | Toggle group |
| FilterAttribute | Dinamik (kateqoriyaya görə) |
| ActiveFilters | Chip list (clear all) |
| SortMenu | Yeni / Qiymət / Populyar |
| ViewSwitcher | Grid / List / Map |
| ResultsHeader | Count + sort + view toggle |

## F. CHAT (`components/chat/`)

| Komponent | |
|---|---|
| ChatList | Chat preview siyahısı |
| ChatPreview | Avatar + son mesaj + zaman + unread |
| ChatWindow | Header + messages + input |
| ChatHeader | Satıcı + elan + menyu |
| MessageList | Virtual scroll + grouping by day |
| MessageBubble | Mətn / şəkil / sistem mesajı |
| MessageInput | Textarea + emoji + attachment + send |
| TypingIndicator | "...yazır" |
| ReadReceipt | Görüldü ✓✓ |
| QuickReplies | Şablon cavablar |
| BlockedBanner | Bağlandı xəbərdarlığı |

## G. AUTH (`components/auth/`)

| Komponent |
|---|
| LoginForm |
| RegisterForm |
| OtpInput (6 hücrəli) |
| OAuthButtons (Google/Apple/Facebook) |
| PasswordStrengthMeter |
| ForgotPasswordForm |
| ResetPasswordForm |
| TwoFactorForm |

## H. PROFILE & DASHBOARD (`components/dashboard/`)

| Komponent |
|---|
| DashboardLayout (sidebar + content) |
| StatsCard (KPI mini) |
| ListingTable (öz elanlar) |
| ListingActions (promote, edit, archive) |
| BalanceCard |
| TransactionTable |
| NotificationList |
| NotificationItem |
| ProfileEditor |
| AvatarUploader |
| SecuritySection (parol, 2FA) |
| SessionList |
| ReviewsList |

## I. SHOP (`components/shop/`)

| Komponent |
|---|
| ShopHeader (cover, logo, kontakt) |
| ShopStats |
| ShopAbout |
| ShopWorkingHours |
| ShopListingsGrid |
| ShopReviews |
| ShopFollowButton |
| ShopMembersTable |
| BulkUploadDropzone |
| ImportProgress |
| AdCampaignTable |
| AdCampaignForm |
| AnalyticsChart (Recharts) |

## J. ADMIN (`components/admin/`)

| Komponent |
|---|
| AdminLayout (sidebar + topbar + breadcrumb) |
| AdminSidebar |
| AdminTopbar (search, notifications, user menu) |
| DataTable (server-side paginate, sort, filter) |
| FilterBar |
| BulkActionBar |
| ApprovalQueue |
| AuditLogTable |
| RoleMatrix |
| BannerEditor |
| CategoryTreeEditor |
| AttributeSchemaEditor |
| RevenueChart |
| ListingHeatmap |
| ModerationCard |

## K. LAYOUT (`components/layout/`)

| Komponent |
|---|
| RootLayout (auth provider, theme, fonts) |
| Header (logo, search, nav, user menu) |
| MobileBottomNav (5 ikon) |
| Footer |
| MainContainer (max-w + padding) |
| StickyBar (mobil aksiya) |
| SkipToContent (a11y) |

## L. PROVIDERS (`lib/providers/`)

- AuthProvider (NextAuth + custom)
- QueryProvider (TanStack Query)
- ToastProvider
- ThemeProvider (next-themes)
- RealtimeProvider (Socket.io connection)
- ErrorBoundary

## M. DESIGN SİSTEMİ

- **Token mənbəyi:** `tokens.css` (CSS variables) + `tailwind.config.ts`
- **Rəng skalası:** primary 50-900, accent 50-900, neutral 50-900
- **Tipoqrafiya:** Inter (UI), Geist Sans (display)
- **Spacing:** 4pt grid (1rem = 16px → 4, 8, 12, 16, 24, 32...)
- **Radius:** sm(6), md(10), lg(14), xl(20), 2xl(28)
- **Shadow:** soft, glow, elevated
- **Animation:** fade, slide-up, scale, ripple
- **Storybook:** hər komponent üçün story (Chromatic visual regression)

## N. KOMPLEKS HOOKS (`hooks/`)

```ts
useAuth()                    // user, login, logout
useListings(params)          // SWR/TanStack Query
useListing(id)
useFavorites()
useChat(chatId)
useRealtime(event, handler)
useDebounce(value, delay)
useInfiniteScroll(ref, onIntersect)
useSearchParams()
useGeolocation()
useUploadImage()
usePostWizard()              // Zustand store
useTheme()
useTranslation()
```
