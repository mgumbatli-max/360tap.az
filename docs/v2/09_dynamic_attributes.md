# 09 — Dynamic Category Attributes və Filter Builder

> Məqsəd: developer **hər yeni filter üçün kod yazmamalıdır**. Admin kateqoriyaya atribut əlavə edir → atribut avtomatik formada, filterdə, detaildə, search index-də görünür.

---

## 1. Model (bax `04`)

`CategoryAttribute` (kateqoriyaya bağlı tərif) + `ListingAttributeValue` (elanın dəyəri) + `Listing.attributes` JSONB (denormalized oxu).

```
Category (avtomobiller)
  ├ CategoryAttribute(key=brand,   type=select,      options=[...], isFilterable, isSearchable)
  ├ CategoryAttribute(key=year,    type=number,      unit=il,       isFilterable)
  ├ CategoryAttribute(key=mileage, type=number,      unit=km,       isFilterable)
  ├ CategoryAttribute(key=fuel,    type=select,      options=[...])
  └ CategoryAttribute(key=features,type=multiselect, options=[kamera, lyuk, ...])
```

### Atribut tipləri → davranış

| Tip | Forma elementi | Filter UI | Saxlama |
|-----|----------------|-----------|---------|
| `string` | text input | mətn axtarış | valueText |
| `number` | number input | min–max range | valueNum |
| `select` | dropdown | checkbox list | valueText |
| `multiselect` | çoxlu seçim | checkbox list (OR) | JSONB array |
| `boolean` | toggle | checkbox | valueBool |
| `range` | iki input | slider | valueNum (min/max) |
| `date` | date picker | tarix range | valueText(ISO) |
| `location` | xəritə/seçim | region/məsafə | lat/lng |

---

## 2. Axın: atribut → bütün sistem

```
Admin: CategoryAttribute əlavə edir (filter builder UI)
   │
   ├─► Elan əlavə forması:  GET /categories/:slug/attributes → dinamik forma render (DynamicForm)
   │
   ├─► Filter paneli:       isFilterable=true olanlar → DynamicFilters (FilterSidebar)
   │
   ├─► Detail səhifəsi:     elanın attributeValues → AttributesTable (AZ etiketlərlə)
   │
   └─► Search index:        isSearchable=true olanlar → Meilisearch searchable/filterable settings
```

**Yazı zamanı (POST /listings):**
1. Servis kateqoriyanın atributlarını yükləyir.
2. Gələn dəyərləri validate edir (tip, required, options).
3. `ListingAttributeValue` (normalized) + `Listing.attributes` JSONB (denormalized) yazır.
4. Meilisearch sənədini yeniləyir.

---

## 3. Filter Builder (admin UI)

Admin paneldə (`/admin/categories/:id/attributes`):
- Atribut əlavə/redaktə/sil, sıralama (drag).
- Hər atribut: key, labelAz/Ru, tip, options, unit, isRequired, isFilterable, isSearchable.
- Önizləmə: formada və filterdə necə görünəcək.
- Dəyişiklik dərhal təsir edir (kod deploy yox).

---

## 4. Vertical-spesifik atributlar (seed nümunəsi)

**Nəqliyyat** (`vehicle_details` + atributlar): brand, model, year, body_type, fuel, engine_cc, transmission, drivetrain, color, mileage, is_new, seats, doors, owners, vin, no_accident, not_painted, customs, battery_kwh, hybrid_type, features[].

**Əmlak** (`real_estate_details` + atributlar): deal_type, property_type, is_new_building, rooms, area, floor, total_floors, repair, metro, has_extract, has_mortgage, amenities[], has_360_tour.

**İş** (`job_details`): position, field, salary_min/max, schedule, experience, education, languages[], cv_required, online_interview.

> Qeyd: ağır/strukturlu vertical sahələr **detail cədvəllərində** (sürətli, tipli sorğu); uzun/dəyişkən siyahı atributları **dynamic attribute** sistemində. İkisi birlikdə işləyir.

---

## 5. Performans

- Filter sorğuları: əsasən **Meilisearch** (faceted) → sürətli.
- Dəqiq Postgres sorğu (fallback): `ListingAttributeValue` indeksləri (`attributeId, valueNum` / `valueText`) + `Listing.attributes` GIN.
- Atribut tərifləri Redis-də keş (kateqoriya başına).
