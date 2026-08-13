# AlbumCerita — Self-Hosted Supabase Migration Audit

> **Tanggal Audit:** 2026-08-12  
> **Status:** Audit Only — Tidak ada perubahan production yang dilakukan  
> **Tujuan:** Menyiapkan migrasi dari Supabase Cloud ke self-hosted Supabase (SumoPod/Cloudeka StorageGRID)

---

## 1. Supabase Client

### File yang Menginisialisasi Supabase Client

| File | Tipe Client | Package |
|------|------------|---------|
| `src/lib/supabase/client.ts` | Browser Client (`createBrowserClient`) | `@supabase/ssr` |
| `src/lib/supabase/server.ts` | Server Client (`createServerClient`) | `@supabase/ssr` |
| `src/lib/supabase/service.ts` | Service Role Client (`createClient`) | `@supabase/supabase-js` |

### Tipe Client yang Digunakan

- **Browser Client** — Didefinisikan di `client.ts`, **tidak diimport aktif** di codebase saat ini.
- **Server Client** — Didefinisikan di `server.ts`, **tidak diimport aktif** di codebase saat ini.
- **Service Role Client** — `createServiceClient` di `service.ts` adalah **satu-satunya client aktif** yang digunakan di production. Digunakan di hampir semua Server Actions dan Server Components.

### Environment Variables yang Digunakan

| Variable | Digunakan Di | Keterangan |
|----------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `client.ts`, `server.ts`, `service.ts` | URL Supabase instance (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `client.ts`, `server.ts` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service.ts` | Service role key — bypass RLS |

---

## 2. Database

### Tabel yang Digunakan Aplikasi

| Tabel | Deskripsi |
|-------|-----------|
| `events` | Data utama setiap event |
| `photos` | Foto yang diupload oleh kontributor |
| `contributors` | Peserta event |
| `client_sessions` | Session token untuk autentikasi host |
| `pin_attempts` | Log percobaan PIN |
| `film_recipes` | Resep efek film untuk pemrosesan foto |
| `admin_users` | Admin internal (FK ke `auth.users`) |

### Relasi Antar Tabel

```
film_recipes(id) <- events.film_recipe_id
events(id) <- photos.event_id        [CASCADE]
events(id) <- contributors.event_id  [CASCADE]
events(id) <- client_sessions.event_id [CASCADE]
auth.users(id) <- admin_users.id     [CASCADE]
```

### Query Patterns

**SELECT:** events, photos, contributors, client_sessions, film_recipes (dari hampir semua pages dan actions)

**INSERT:** events (create event), contributors (join), client_sessions (host auth), photos (upload)

**UPDATE:** events (publish/unpublish/config), photos (is_hidden, deleted_at), contributors (roll_developed_at)

**DELETE:** events (hard delete → cascade semua relasi)

### RPC / Function Calls

**Tidak ada** panggilan `.rpc()`. Semua query menggunakan Supabase PostgREST.

### Database Functions (PostgreSQL)

| Function | Keterangan |
|----------|------------|
| `update_updated_at_column()` | Trigger untuk `events.updated_at` |
| `is_admin()` | Security definer untuk RLS policies |

### RLS

RLS diaktifkan di semua tabel. **Catatan:** Seluruh app menggunakan service role key yang bypass RLS otomatis.

---

## 3. Authentication

**Aplikasi TIDAK menggunakan Supabase Auth untuk end user.**

| Aktor | Auth Method | Mekanisme |
|-------|-------------|-----------|
| Guest/Contributor | Custom PIN + Nama | Cookie `contributor_id` |
| Host | Custom PIN | Cookie `host_session_<slug>` + `client_sessions` table |
| Admin (internal) | Supabase Auth | `auth.users` → `admin_users` FK |

Session disimpan di HTTP-only cookies — tidak bergantung Supabase Auth JWT.

---

## 4. Storage

### Bucket

| Bucket | Visibilitas |
|--------|-------------|
| `albumcerita_photos` | **Private** |

### Storage Paths

| Konten | Format |
|--------|--------|
| Foto event | `{event_uuid}/{random_uuid}.{ext}` |
| Cover image | `covers/{event_id}-{timestamp}.{ext}` |

### Operasi

| Operasi | Method |
|---------|--------|
| Upload foto | `.upload(path, buffer, { contentType, upsert: false })` |
| Upload cover | `.upload(path, buffer, { contentType, upsert: false })` |
| Public URL | `.getPublicUrl(path)` |
| Signed URL (1 item) | `.createSignedUrl(path, 3600)` |
| Signed URLs (batch) | `.createSignedUrls(paths[], 3600)` |

### Konfirmasi Kompatibilitas StorageGRID

**Tidak ditemukan TUS/resumable upload.** Semua upload menggunakan Standard Upload:

```typescript
// event/[eventId]/actions.ts (L142-L147)
const { error: uploadError } = await supabase.storage
  .from(bucketName)
  .upload(storagePath, buffer, {   // Buffer.from(arrayBuffer)
    contentType: file.type,
    upsert: false,
  });
```

Upload melewati Server Action — file dikonversi ke `Buffer` di server. Kompatibel penuh dengan SumoPod/StorageGRID.

**Tidak perlu perubahan kode upload.**

---

## 5. Realtime

**Tidak digunakan.** Tidak ada `supabase.channel()`, `.on('postgres_changes')`, atau `.subscribe()`.

---

## 6. Edge Functions

**Tidak digunakan.** Tidak ada `supabase.functions.invoke()`.

API internal menggunakan Next.js Route Handlers (`/api/download/[slug]/route.ts`).

---

## 7. Environment Variables

```env
# Wajib
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Catatan:
# - Bucket name `albumcerita_photos` sudah hardcoded di codebase
# - Upload size limit 20mb dikonfigurasi di next.config.ts
```

---

## 8. Migration Readiness Report

### A. Yang Harus Dipindahkan

| Item | Prioritas |
|------|-----------|
| Database (PostgreSQL) — schema + data | KRITIS |
| Storage bucket `albumcerita_photos` — semua files | KRITIS |
| Data `film_recipes` | KRITIS |
| Data `events`, `photos`, `contributors` | KRITIS |
| Data `client_sessions` | PENTING |
| Supabase Auth users (jika ada admin) | PENTING |

### B. Yang Harus Dikonfigurasi Ulang

- `NEXT_PUBLIC_SUPABASE_URL` → URL self-hosted
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → key dari self-hosted
- `SUPABASE_SERVICE_ROLE_KEY` → key dari self-hosted
- Bucket `albumcerita_photos` (private) di self-hosted
- RLS policies (jalankan ulang migration SQL)

### C. Yang Tidak Perlu Dipindahkan

- Supabase Auth config (tidak digunakan untuk end user)
- Supabase Edge Functions (tidak digunakan)
- Supabase Realtime (tidak digunakan)

### D. Risiko Migrasi

| Risiko | Tingkat | Mitigasi |
|--------|---------|---------|
| Downtime saat cutover | Tinggi | Maintenance window; siapkan rollback |
| Kehilangan file Storage | Tinggi | Backup semua objek sebelum migrasi |
| `original_url` merujuk Supabase Cloud | Sedang | App override dengan signed URL — aman jika `storage_path` valid |
| Storage path mismatch | Sedang | Copy path identik ke self-hosted |
| Host session invalid | Rendah | Host login ulang (30 hari expiry) |
| TUS/StorageGRID incompatibility | TIDAK ADA | Upload sudah Standard Upload |

### E. Urutan Migrasi yang Aman

```
FASE 1 — PREPARATION (tanpa downtime)
  - Setup self-hosted Supabase
  - Generate API keys
  - Buat bucket `albumcerita_photos` (private)
  - Jalankan migrations (urutan di bawah)

FASE 2 — DATA MIGRATION (maintenance window)
  - Export: pg_dump dari Supabase Cloud
  - Import: ke self-hosted PostgreSQL
  - Copy: semua Storage files ke self-hosted
  - Verifikasi integritas

FASE 3 — STAGING TEST
  - Update env vars → self-hosted
  - Test semua flow (join, upload, host, publish, download)

FASE 4 — CUTOVER (downtime singkat)
  - Final sync
  - Update env vars production
  - Deploy ulang
  - Smoke test

FASE 5 — POST-MIGRATION
  - Monitor logs 24 jam
  - Pertahankan Supabase Cloud 2 minggu (fallback)
```

---

## 9. File Kritis untuk Migrasi

| File | Notes |
|------|-------|
| `src/lib/supabase/service.ts` | Satu-satunya client aktif |
| `src/app/event/[eventId]/actions.ts` | Upload foto (Standard Upload) |
| `src/app/admin/events/[eventId]/actions.ts` | Upload cover image (Standard Upload) |
| `src/app/api/download/[slug]/route.ts` | Download ZIP via signed URLs |
| `.env.local` (production) | **Wajib diupdate saat cutover** |
| `next.config.ts` | Pertahankan `bodySizeLimit: '20mb'` |

---

## 10. Urutan Migrasi Database

Jalankan migrations di urutan berikut di self-hosted instance:

1. `supabase/migrations/20260615000000_init_schema.sql`
2. `supabase/migrations/20260618000000_sprint_3c_additive.sql`
3. `supabase/migrations/20260618000001_fix_client_sessions.sql`
4. `supabase/migrations/20260618000002_add_plain_guest_pin.sql`
5. `supabase/migrations/20260626000000_sprint_3da_publish.sql`
6. `supabase/migrations/20260719000000_sprint_3f_film_recipes.sql`
7. `supabase/migrations/20260719000001_add_roll_development_gate.sql`
8. `supabase/migrations/20260730000000_fix_film_recipe_settings.sql`
9. `supabase/migrations/20260812000000_add_auto_publish_at.sql`

> **Alternatif:** Gunakan `FINAL_PRODUCTION_SCHEMA.sql` sebagai base, lalu apply migration #5 ke atas.

---

## 11. Checklist Langkah Berikutnya

### Pre-Migration
- [ ] Setup self-hosted Supabase instance
- [ ] Generate API keys (URL, anon, service role)
- [ ] Buat bucket `albumcerita_photos` (private)
- [ ] Jalankan 9 migration SQL di urutan yang benar
- [ ] Backup database Supabase Cloud (`pg_dump`)
- [ ] Backup semua file Storage
- [ ] Import database ke self-hosted
- [ ] Copy Storage files ke self-hosted (path identik)
- [ ] Verifikasi: `SELECT count(*) FROM events, photos, film_recipes;`

### Staging Test
- [ ] Update `.env.local` → self-hosted values
- [ ] Join event sebagai guest → upload foto → signed URL muncul
- [ ] Host login → view photos → toggle visibility → publish
- [ ] Public album `/album/[slug]` accessible
- [ ] Download ZIP `/api/download/[slug]`
- [ ] Admin: create event, upload cover, delete event

### Production Cutover
- [ ] Announce maintenance window
- [ ] Final sync data
- [ ] Update env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Deploy ulang Next.js app
- [ ] Smoke test production
- [ ] Monitor logs 24 jam

### Post-Migration
- [ ] Verifikasi foto lama accessible via signed URL
- [ ] Pertahankan Supabase Cloud 2 minggu
- [ ] Shutdown Supabase Cloud setelah stable

---

## 12. Catatan Penting

### `original_url` vs `storage_path`

Kolom `original_url` di `photos` menyimpan URL Supabase Cloud. Setelah Cloud dimatikan, URL ini tidak valid. **Ini aman** karena:
- Semua gallery page sudah menggunakan `createSignedUrls(storage_path)` sebagai override
- Yang penting: semua file Storage di-copy ke self-hosted dengan path **identik**

### `admin_users` dan Supabase Auth

Tabel `admin_users` FK ke `auth.users`. Cek dengan:
```sql
SELECT * FROM admin_users;
```
Jika ada data → admin perlu di-migrate atau di-recreate di self-hosted Auth.

---

*Audit dilakukan pada 2026-08-12. Tidak ada perubahan production yang dilakukan.*
