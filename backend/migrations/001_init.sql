-- Avito.az — DB sxem (PostgreSQL 16)
-- İzolasiya edilmiş baza: avito_az

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "citext";

-- =========================================================
-- USERS
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           CITEXT UNIQUE,
  phone           VARCHAR(20) UNIQUE,
  password_hash   TEXT NOT NULL,
  full_name       VARCHAR(120) NOT NULL,
  avatar_url      TEXT,
  bio             TEXT,
  city            VARCHAR(80),
  role            VARCHAR(20) NOT NULL DEFAULT 'user',
  status          VARCHAR(20) NOT NULL DEFAULT 'active',
  is_phone_verified  BOOLEAN NOT NULL DEFAULT false,
  is_email_verified  BOOLEAN NOT NULL DEFAULT false,
  is_business        BOOLEAN NOT NULL DEFAULT false,
  rating          NUMERIC(3,2) NOT NULL DEFAULT 0,
  reviews_count   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ,
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- =========================================================
-- CATEGORIES (3 səviyyəli ağac)
-- =========================================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id   UUID REFERENCES categories(id) ON DELETE CASCADE,
  slug        VARCHAR(120) UNIQUE NOT NULL,
  name_az     VARCHAR(120) NOT NULL,
  name_ru     VARCHAR(120),
  name_en     VARCHAR(120),
  icon        VARCHAR(60),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug   ON categories(slug);

-- =========================================================
-- CITIES
-- =========================================================
CREATE TABLE IF NOT EXISTS cities (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug      VARCHAR(80) UNIQUE NOT NULL,
  name_az   VARCHAR(80) NOT NULL,
  name_ru   VARCHAR(80),
  name_en   VARCHAR(80),
  region    VARCHAR(80),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- =========================================================
-- LISTINGS
-- =========================================================
CREATE TABLE IF NOT EXISTS listings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id   UUID NOT NULL REFERENCES categories(id),
  city_id       UUID REFERENCES cities(id),
  title         VARCHAR(120) NOT NULL,
  slug          VARCHAR(160) NOT NULL,
  description   TEXT NOT NULL,
  price         NUMERIC(14,2),
  currency      VARCHAR(3) NOT NULL DEFAULT 'AZN',
  price_type    VARCHAR(20) NOT NULL DEFAULT 'fixed',  -- fixed/negotiable/free/exchange
  condition     VARCHAR(20),                            -- new/like_new/used
  attributes    JSONB NOT NULL DEFAULT '{}'::jsonb,
  contact_name  VARCHAR(120),
  contact_phone VARCHAR(20),
  address       TEXT,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  status        VARCHAR(20) NOT NULL DEFAULT 'active',  -- draft/review/active/sold/expired/rejected/archived
  is_vip        BOOLEAN NOT NULL DEFAULT false,
  is_premium    BOOLEAN NOT NULL DEFAULT false,
  is_highlight  BOOLEAN NOT NULL DEFAULT false,
  vip_until     TIMESTAMPTZ,
  views         INTEGER NOT NULL DEFAULT 0,
  favorites_count INTEGER NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_status_created ON listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_category       ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_city           ON listings(city_id);
CREATE INDEX IF NOT EXISTS idx_listings_owner          ON listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_price          ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_attributes_gin ON listings USING GIN (attributes);
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm     ON listings USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_vip            ON listings(is_vip, vip_until DESC);

-- =========================================================
-- LISTING MEDIA
-- =========================================================
CREATE TABLE IF NOT EXISTS listing_media (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  type        VARCHAR(20) NOT NULL DEFAULT 'image',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  width       INTEGER,
  height      INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listing_media_listing ON listing_media(listing_id, sort_order);

-- =========================================================
-- FAVORITES
-- =========================================================
CREATE TABLE IF NOT EXISTS favorites (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

-- =========================================================
-- CHATS & MESSAGES
-- =========================================================
CREATE TABLE IF NOT EXISTS chats (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(listing_id, buyer_id, seller_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id   UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content   TEXT NOT NULL,
  read_at   TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at);

-- =========================================================
-- REVIEWS
-- =========================================================
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id  UUID REFERENCES listings(id) ON DELETE SET NULL,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- COMPLAINTS
-- =========================================================
CREATE TABLE IF NOT EXISTS complaints (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id  UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  reason      VARCHAR(40) NOT NULL,
  detail      TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- =========================================================
-- PAYMENTS / PROMOTIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id),
  listing_id    UUID REFERENCES listings(id),
  amount        NUMERIC(14,2) NOT NULL,
  currency      VARCHAR(3) NOT NULL DEFAULT 'AZN',
  type          VARCHAR(30) NOT NULL,    -- vip/boost/premium/highlight/escrow
  status        VARCHAR(20) NOT NULL DEFAULT 'pending',
  provider      VARCHAR(40),
  provider_ref  VARCHAR(120),
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- TRIGGERS — updated_at
-- =========================================================
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

DROP TRIGGER IF EXISTS listings_set_updated_at ON listings;
CREATE TRIGGER listings_set_updated_at BEFORE UPDATE ON listings
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
