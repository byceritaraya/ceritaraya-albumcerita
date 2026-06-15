# AlbumCerita — Technical Architecture
> *Acting as: Senior Solution Architect*
> *Status: v1 FINAL (Locked for MVP Development)*

---

## 1. High-level System Architecture

The AlbumCerita MVP is a serverless, managed-service platform optimized for mobile-first photo capture and fast gallery loading.

**Frontend:**
- Next.js 14+ (App Router) deployed on Vercel.
- Edge Network delivery for fast loading at events.
- React Server Components (RSC) for SEO-friendly landing/demo pages.
- Client Components for interactive elements (Camera, Gallery, Dashboard).

**Backend & Database:**
- Supabase (PostgreSQL) for relational data and robust Row Level Security (RLS).
- Supabase Auth for Admin JWT management.
- Supabase Storage for secure, scalable photo object storage.
- Supabase Realtime for live gallery updates *(Optional MVP Enhancement)*.

**CDN:**
- Cloudflare CDN (via Supabase Storage) for optimized image delivery.

---

## 2. Next.js Project Folder Structure

A feature-based App Router structure cleanly separates public marketing, guest experience, client dashboards, and admin tools.

```text
/src
├── app
│   ├── (public)
│   │   ├── page.tsx                 # Landing Page (/)
│   │   └── demo
│   │       └── [slug]/page.tsx      # Demo Pages (/demo/wedding)
│   ├── (guest)
│   │   └── albumcerita
│   │       └── [slug]
│   │           ├── page.tsx         # Guest Event Page
│   │           └── camera/page.tsx  # Camera Experience
│   ├── (client)
│   │   └── albumcerita
│   │       ├── event/page.tsx       # Client Login (/albumcerita/event)
│   │       └── manage
│   │           └── [eventId]/page.tsx # Client Dashboard
│   └── (admin)
│       └── admin
│           ├── login/page.tsx       # Admin Login
│           ├── page.tsx             # Event List
│           └── events
│               ├── new/page.tsx     # Create Event
│               └── [id]/page.tsx    # Edit/View Event
├── components
│   ├── ui/                          # shadcn/ui generic components
│   ├── camera/                      # WebRTC camera capture components
│   ├── gallery/                     # Masonry grid, lightboxes
│   └── forms/                       # Login and Event CRUD forms
├── lib
│   ├── supabase/                    # Supabase client instances (browser/server)
│   ├── utils/                       # Tailwind merge, formatting helpers
│   └── qrcode/                      # QR generation logic
├── actions                          # Next.js Server Actions (Auth, Uploads)
└── styles
    └── globals.css                  # Tailwind + Design Tokens
```

---

## 3. Supabase Database Design

Implementation of the PRD v1.3 schema with strict data typing and updated NOT NULL rules.

### Table: `events`
```sql
CREATE TABLE events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  event_id text UNIQUE NOT NULL,
  pin_hash text NOT NULL,
  name text NOT NULL,
  event_type text NOT NULL,
  state text DEFAULT 'draft' CHECK (state IN ('draft', 'published', 'expired', 'archived')),
  cover_image_url text,
  event_date date,
  venue text,
  welcome_message text,
  photos_per_guest integer NOT NULL CHECK (photos_per_guest IN (5, 10, 20, 36)),
  max_contributors integer NOT NULL CHECK (max_contributors IN (20, 50, 100, 9999)), -- 9999 = unlimited
  retention_months integer NOT NULL CHECK (retention_months IN (1, 3, 6, 12)),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Table: `photos`
```sql
CREATE TABLE photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  guest_token text NOT NULL,
  guest_name text NOT NULL,
  storage_path text NOT NULL,
  thumbnail_path text,
  original_url text NOT NULL,
  thumbnail_url text,
  file_size_bytes integer NOT NULL,
  width integer,
  height integer,
  is_hidden boolean DEFAULT false,
  deleted_at timestamptz,
  uploaded_at timestamptz DEFAULT now()
);
```

### Table: `admin_users`
```sql
CREATE TABLE admin_users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at timestamptz DEFAULT now()
);
```

### Table: `client_sessions`
```sql
CREATE TABLE client_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  ip_address text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### Table: `pin_attempts`
```sql
CREATE TABLE pin_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL,
  event_id text NOT NULL,
  succeeded boolean NOT NULL,
  attempted_at timestamptz DEFAULT now()
);
```

---

## 4. Database Relationships

- **`photos.event_id`** → Many-to-One → **`events.id`**
  - Enforcement: Cascade delete. If an event is deleted, all its photo records are removed.
- **`client_sessions.event_id`** → Many-to-One → **`events.id`**
  - Enforcement: Cascade delete. Invalidates client sessions if the underlying event is removed.
- **`admin_users.id`** → One-to-One → **`auth.users.id`**
  - Enforcement: Tied directly to Supabase Auth system. Deleting the auth user removes the admin profile.

---

## 5. Supabase Storage Bucket Structure

**Bucket:** `albumcerita_photos`
- **Visibility:** Private (Signed URLs used for delivery to ensure access control).

**Path Structure:**
```text
/ [event_id] / [guest_token] / [uuid_filename.ext]
```
*Example:* `/CRA-7K9X2P/d9b2d63d-a233.../a1b2c3d4-original.webp`
*Example:* `/CRA-7K9X2P/d9b2d63d-a233.../a1b2c3d4-thumb.webp`

This structure allows easy bucket-level isolation per event and quick identification of photos by specific guests if forensic deletion is required.

---

## 6. Row Level Security (RLS) Strategy

PostgreSQL RLS ensures that the frontend cannot accidentally expose data or bypass business logic.

**`events` Table:**
- `SELECT` (Public): **RESTRICTED**. Do not expose `events` to public anonymous SELECT queries to prevent enumeration and scraping of draft events. Guests must access events via a Next.js Server Action or React Server Component that explicitly queries by `slug` (using a service key or server-side DB client) and enforces `state IN ('draft', 'published')`.
- `INSERT/UPDATE/DELETE`: `authenticated` role AND `admin_users.role = 'admin'`

**`photos` Table:**
- `SELECT` (Guest): Public. Only returns rows where `event_id = ?` AND `deleted_at IS NULL` AND `is_hidden = false`.
- `SELECT` (Client): Allowed via custom Server Action validating `client_sessions` token.
- `INSERT` (Guest): Allowed via a Server Action that performs the contributor limit check and `event.state = 'draft'` check atomically before writing.
- `UPDATE/DELETE`: `authenticated` role AND `admin_users.role = 'admin'` (Clients update via Server Actions to prevent arbitrary modification).

---

## 7. Authentication Strategy

**Admin Auth:**
- Supabase Auth (Email/Password).
- Short-lived JWTs.
- Protected `/admin/*` Next.js routes using Middleware verifying the Supabase session.

**Client Auth (Event ID + PIN):**
1. Client submits Event ID (`CRA-7K9X2P`) + PIN (`826491`).
2. Server Action hashes PIN with bcrypt and compares against `events.pin_hash`.
3. Checks `pin_attempts` to enforce 5 attempts / 15 mins rule.
4. On success, generates a cryptographically secure `session_token`.
5. Stores token in `client_sessions` with 24h `expires_at`.
6. Sets `HttpOnly`, `Secure`, `SameSite=Strict` cookie containing the `session_token`.
7. Next.js Middleware protects `/albumcerita/manage/*` by validating this cookie against the DB.

---

## 8. Event ID and PIN Security Strategy

- **Event ID:** `CRA-` followed by 6 securely generated random uppercase alphanumeric characters. Avoid confusing characters (0/O, 1/I). Not a primary key.
- **PIN:** 6-digit numeric string generated via secure PRNG (e.g., `crypto.randomInt(100000, 999999)`).
- **Storage:** PINs are *never* stored in plaintext. Hashed using `bcrypt` before database insertion.
- **Brute Force Protection:** The `pin_attempts` table tracks every login attempt by IP. If `COUNT(*) WHERE ip = ? AND succeeded = false AND attempted_at > NOW() - INTERVAL '15 mins' >= 5`, reject request instantly before DB check.

---

## 9. Guest Token Strategy

- **Generation:** On a guest's first page load of `/albumcerita/[slug]`, the client checks `localStorage.getItem('ac_guest_token')`. If missing, it generates a `uuid.v4()` and saves it.
- **Scope:** Browser-specific. If they switch to Incognito or a different device, they are a "new" guest.
- **Privacy:** It is an opaque UUID. No device APIs (User-Agent, Canvas Fingerprinting) are used to generate it.
- **Usage:** Passed alongside every photo upload payload to associate the photo with the guest and enforce the per-guest photo limit.

---

## 10. API Route Architecture

We will favor Next.js **Server Actions** over traditional API routes (`/api`) for seamless TypeScript integration and form handling.

**Core Server Actions:**
- `uploadPhoto(eventId, guestToken, guestName, file)`: Handles multipart form data, validates MIME/size, strips EXIF, uploads to Storage, creates `photos` record.
- `clientLogin(eventId, pin)`: Validates credentials, issues cookie.
- `moderatePhoto(photoId, action)`: `action` ∈ `['hide', 'unhide', 'trash', 'restore']`. Validates client session.
- `publishAlbum(eventId)`: Transitions state to `Published`.
- `generateZip(eventId)`: Admin/Client action to trigger async ZIP creation of visible photos.

---

## 11. Image Upload Flow

1. **Client Capture:** WebRTC Camera API captures `Blob` (JPEG/WEBP).
2. **Client Validation:** Check size (<15MB) and type.
3. **Submission:** Calls `uploadPhoto` Server Action.
4. **Server Pre-checks:**
   - Verify `events.state === 'draft'`.
   - Verify contributor limit (Atomically check if new `guest_token` exceeds `max_contributors`).
   - Verify per-guest limit (`COUNT < photos_per_guest`).
5. **Processing:** Strip EXIF data using an Edge-compatible library or Node.js Buffer manipulation.
6. **Storage:** Upload original to `albumcerita_photos/[event_id]/[guest_token]/[uuid].webp`. Generate and upload 400px thumbnail.
7. **Database:** Insert row into `photos`.
8. **Realtime Updates *(Optional MVP Enhancement)*:** Broadcast new row to clients viewing the gallery/dashboard.

---

## 12. Publish Album Flow

1. Client clicks "Publish Album" in the dashboard.
2. Confirmation dialog warns that uploads will be permanently locked.
3. Client confirms.
4. Server Action `publishAlbum` is invoked.
5. Verifies client session cookie owns the `event_id`.
6. Updates `events` table: `UPDATE events SET state = 'published' WHERE id = ?`.
7. **Realtime Updates *(Optional MVP Enhancement)*:** Broadcast state change to connected clients.
8. Any active guest camera views immediately transition to the "Uploads Closed" screen.
9. Guest event pages unlock the public gallery view.

---

## 13. Contributor Limit Enforcement Flow

**Critical Path: Preventing Race Conditions**

To ensure we don't exceed `max_contributors` when 50 guests upload simultaneously:

We use a PostgreSQL transaction within the `uploadPhoto` logic:

```sql
BEGIN;
-- 1. Lock the event row to serialize contributor checks
SELECT max_contributors FROM events WHERE id = $1 FOR UPDATE;

-- 2. Check if this guest is already a contributor
SELECT 1 FROM photos WHERE event_id = $1 AND guest_token = $2 LIMIT 1;
-- If YES -> Skip limit check, proceed to upload.

-- 3. If NO -> Count distinct contributors
SELECT COUNT(DISTINCT guest_token) FROM photos WHERE event_id = $1;

-- 4. Evaluate Limit
-- If count >= max_contributors -> ROLLBACK and throw ContributorLimitError
-- If count < max_contributors -> Proceed to insert photo, committing the transaction.
COMMIT;
```

---

## 14. Trash & Restore Flow

**Client "Move to Trash":**
1. Client invokes `moderatePhoto(photoId, 'trash')`.
2. Server validates client session.
3. `UPDATE photos SET deleted_at = now() WHERE id = ?`.
4. Photo disappears from main client gallery and public gallery.
5. Photo appears in the Trash tab.

**Client "Restore":**
1. Client invokes `moderatePhoto(photoId, 'restore')`.
2. `UPDATE photos SET deleted_at = NULL WHERE id = ?`.
3. Photo returns to main gallery.

**Admin "Permanent Delete":**
1. Admin invokes `adminDeletePhoto(photoId)`.
2. Server removes files from Supabase Storage bucket.
3. `DELETE FROM photos WHERE id = ?`.

---

## 15. Retention & Expiration Flow

1. **Creation:** Admin sets `retention_months` (e.g., 6). System sets `expires_at = event_date + 6 months`.
2. **Daily Cron Job:** A Vercel Cron or Supabase pg_cron runs nightly.
3. **Expiration:** `UPDATE events SET state = 'expired' WHERE state = 'published' AND expires_at < now()`.
   - Guest URLs now show "Event Expired".
4. **Archival (Manual/Future Auto):** Admin reviews Expired events. Admin clicks "Archive Event", which triggers a bulk delete of photos from the storage bucket to save costs, then sets state to `archived`.

---

## 16. Production Deployment Architecture

- **Frontend Hosting:** Vercel (Hobby or Pro tier initially). Native support for Next.js App Router, Server Actions, and Edge functions.
- **Database/Auth/Storage:** Supabase Managed Platform.
- **Custom Domain:** `ceritaraya.com` configured in Vercel with automatic Let's Encrypt SSL.
- **Database Scaling:** Enable Supabase Point-in-Time Recovery (PITR) and read replicas if event load scales heavily.

---

## 17. Environment Variables Required

`.env.local`

```env
# Next.js Public
NEXT_PUBLIC_SITE_URL=https://ceritaraya.com
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Server Secrets (Never exposed to client)
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # For admin-level DB bypass during specific Server Actions
JWT_SECRET=super_secure_random_string # For signing client PIN session tokens
CRON_SECRET=secure_string             # To authenticate automated expiration requests
```

---

## 18. Development Roadmap (Technical Perspective)

**Phase 1: Foundation (Days 1-3)**
- Scaffold Next.js + Tailwind + shadcn/ui.
- Provision Supabase project. Define SQL schema and RLS policies.
- Build generic UI components (Buttons, Inputs, Cards).

**Phase 2: Guest Capture Engine (Days 4-7)**
- Implement WebRTC Camera component.
- Implement Guest Token generation and `localStorage` state.
- Build `uploadPhoto` Server Action with strict transaction locking for contributor limits.
- Build Guest Event Page layout.

**Phase 3: Client Dashboard & Auth (Days 8-10)**
- Implement PIN hashing and session cookie flow.
- Build Client Dashboard Stats and Gallery views.
- Implement Hide/Trash/Restore Server Actions.
- Implement "Publish Album" state machine toggle.

**Phase 4: Admin & Tools (Days 11-13)**
- Implement Supabase Auth login for Admin.
- Build Event CRUD forms.
- Integrate `qrcode` generator.
- Implement ZIP generation worker logic.

**Phase 5: Polish & Security (Days 14-15)**
- EXIF stripping implementation.
- Brute-force rate limiter finalization.
- Error boundary handling and Toast notifications.
- Performance auditing (Lighthouse).
- **Optional:** Integrate Supabase Realtime for live gallery/dashboard updates.
