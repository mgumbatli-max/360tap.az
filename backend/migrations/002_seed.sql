-- Seed: Kateqoriyalar, şəhərlər, admin user

-- ŞƏHƏRLƏR
INSERT INTO cities (slug, name_az, name_ru, name_en, region, sort_order) VALUES
  ('baki',         'Bakı',          'Баку',          'Baku',         'Abşeron', 1),
  ('sumqayit',     'Sumqayıt',      'Сумгайыт',      'Sumgait',      'Abşeron', 2),
  ('ganca',        'Gəncə',         'Гянджа',        'Ganja',        'Qərb',    3),
  ('mingacevir',   'Mingəçevir',    'Мингячевир',    'Mingachevir',  'Mərkəz',  4),
  ('lenkeran',     'Lənkəran',      'Ленкорань',     'Lankaran',     'Cənub',   5),
  ('seki',         'Şəki',          'Шеки',          'Shaki',        'Şm-Q',    6),
  ('quba',         'Quba',          'Куба',          'Quba',         'Şimal',   7),
  ('xachmaz',      'Xaçmaz',        'Хачмаз',        'Khachmaz',     'Şimal',   8),
  ('saatli',       'Saatlı',        'Саатлы',        'Saatly',       'Mərkəz',  9),
  ('shamakhi',     'Şamaxı',        'Шемаха',        'Shamakhi',     'Mərkəz',  10),
  ('absheron',     'Abşeron',       'Абшерон',       'Absheron',     'Abşeron', 11),
  ('digar',        'Digər',         'Другой',        'Other',        '',        99)
ON CONFLICT (slug) DO NOTHING;

-- KATEQORİYALAR (kök)
INSERT INTO categories (id, slug, name_az, name_ru, name_en, icon, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000001', 'dasinmaz-emlak', 'Daşınmaz əmlak',     'Недвижимость',     'Real Estate',  'home',     1),
  ('11111111-0000-0000-0000-000000000002', 'neqliyyat',      'Nəqliyyat',          'Транспорт',        'Transport',    'car',      2),
  ('11111111-0000-0000-0000-000000000003', 'is-elanlari',    'İş elanları',        'Работа',           'Jobs',         'briefcase',3),
  ('11111111-0000-0000-0000-000000000004', 'xidmetler',      'Xidmətlər',          'Услуги',           'Services',     'wrench',   4),
  ('11111111-0000-0000-0000-000000000005', 'elektronika',    'Elektronika',        'Электроника',      'Electronics',  'cpu',      5),
  ('11111111-0000-0000-0000-000000000006', 'ev-ve-bag',      'Ev və bağ',          'Дом и сад',        'Home & Garden','sofa',     6),
  ('11111111-0000-0000-0000-000000000007', 'geyim',          'Geyim, ayaqqabı',    'Одежда',           'Fashion',      'shirt',    7),
  ('11111111-0000-0000-0000-000000000008', 'usaq',           'Uşaqlar üçün',       'Детям',            'Kids',         'baby',     8),
  ('11111111-0000-0000-0000-000000000009', 'xobbi',          'Xobbi və istirahət', 'Хобби и отдых',    'Hobby',        'gift',     9),
  ('11111111-0000-0000-0000-00000000000a', 'heyvanlar',      'Heyvanlar',          'Животные',         'Pets',         'paw',      10),
  ('11111111-0000-0000-0000-00000000000b', 'idman',          'İdman',              'Спорт',            'Sport',        'dumbbell', 11),
  ('11111111-0000-0000-0000-00000000000c', 'kend-teserrufati','Kənd təsərrüfatı',  'Сельское хоз-во',  'Agriculture',  'tractor',  12),
  ('11111111-0000-0000-0000-00000000000d', 'biznes',         'Biznes və avadanlıq','Бизнес',           'Business',     'building', 13)
ON CONFLICT (slug) DO NOTHING;

-- ALT-KATEQORİYALAR (Daşınmaz əmlak)
INSERT INTO categories (parent_id, slug, name_az, name_ru, name_en, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000001', 'menzil-satilir',    'Mənzil — satılır',  'Квартиры — продажа', 'Apartments — Sale',     1),
  ('11111111-0000-0000-0000-000000000001', 'menzil-kiraye',     'Mənzil — kirayə',   'Квартиры — аренда',  'Apartments — Rent',     2),
  ('11111111-0000-0000-0000-000000000001', 'ev-villa-satilir',  'Ev / villa',        'Дома / виллы',       'Houses / Villas',       3),
  ('11111111-0000-0000-0000-000000000001', 'obyekt',            'Obyekt',            'Коммерческие',       'Commercial',            4),
  ('11111111-0000-0000-0000-000000000001', 'torpaq',            'Torpaq',            'Земля',              'Land',                  5),
  ('11111111-0000-0000-0000-000000000001', 'sutkalik',          'Sutkalıq kirayə',   'Посуточно',          'Daily Rent',            6)
ON CONFLICT (slug) DO NOTHING;

-- ALT-KATEQORİYALAR (Nəqliyyat)
INSERT INTO categories (parent_id, slug, name_az, name_ru, name_en, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000002', 'avtomobil',         'Avtomobil',         'Автомобили',         'Cars',                  1),
  ('11111111-0000-0000-0000-000000000002', 'motosiklet',        'Motosiklet',        'Мотоциклы',          'Motorcycles',           2),
  ('11111111-0000-0000-0000-000000000002', 'su-neqliyyati',     'Su nəqliyyatı',     'Водный транспорт',   'Boats',                 3),
  ('11111111-0000-0000-0000-000000000002', 'yuk-neqliyyati',    'Yük nəqliyyatı',    'Грузовой',           'Trucks',                4),
  ('11111111-0000-0000-0000-000000000002', 'ehtiyat-hisseler',  'Ehtiyat hissələri', 'Запчасти',           'Parts',                 5)
ON CONFLICT (slug) DO NOTHING;

-- ALT-KATEQORİYALAR (Elektronika)
INSERT INTO categories (parent_id, slug, name_az, name_ru, name_en, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000005', 'telefon',           'Telefon',           'Телефоны',           'Phones',                1),
  ('11111111-0000-0000-0000-000000000005', 'kompyuter',         'Kompüter',          'Компьютеры',         'Computers',             2),
  ('11111111-0000-0000-0000-000000000005', 'noutbuk',           'Noutbuk',           'Ноутбуки',           'Laptops',               3),
  ('11111111-0000-0000-0000-000000000005', 'tv-audio',          'TV / Audio',        'ТВ / Аудио',         'TV / Audio',            4),
  ('11111111-0000-0000-0000-000000000005', 'foto',              'Foto / Video',      'Фото / Видео',       'Photo / Video',         5),
  ('11111111-0000-0000-0000-000000000005', 'oyun-konsollari',   'Oyun konsolları',   'Игровые приставки',  'Gaming',                6)
ON CONFLICT (slug) DO NOTHING;

-- ADMİN İSTİFADƏÇİ (parol: admin123 — bcrypt hash)
-- Hash bcrypt cost=10 ilə "admin123" üçün
INSERT INTO users (email, phone, password_hash, full_name, role, is_email_verified, is_phone_verified)
VALUES (
  'admin@avito.az',
  '+994501112233',
  '$2b$10$rZx8N8X8bV4gK1m3hQqHHe9P9UZ6VDfP8gKmYOZc9Pnb9pAP9k1vW',
  'Avito Admin',
  'admin',
  true,
  true
) ON CONFLICT (email) DO NOTHING;
