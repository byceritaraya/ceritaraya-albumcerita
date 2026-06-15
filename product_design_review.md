# AlbumCerita — Senior Product Design Review
> *Acting as: Senior Product Designer · UX Architect · Startup Founder · Software Architect*
> *Date: June 2026 | Status: Pre-Build Critical Review*

---

## Part I — Critical Analysis

### ① Product Weaknesses

| # | Weakness | Why It Matters |
|---|----------|----------------|
| 1 | **No guest identity / attribution** | Photos are anonymous. You lose the "who took this" story dimension — and lose trust signals when inappropriate photos appear. |
| 2 | **Photo limit is undefined** | The PRD mentions a "remaining photo counter" but never defines *who* sets the limit, *per guest* or *per event*, and what happens when it's reached. This is a core product mechanic left unanswered. |
| 3 | **No moderation layer** | A public QR code at a wedding can be scanned by anyone. Without moderation or photo approval, a single bad actor can ruin the album — and the event. This is a liability, not a feature gap. |
| 4 | **Managed service = scaling ceiling** | Every event requires admin intervention. At 10 events/month this is fine. At 100, you have a bottleneck. The "no self-service" constraint creates a hard operational ceiling you'll hit faster than expected. |
| 5 | **PIN + Event ID is the only access control** | A 4-digit PIN is brute-forceable in minutes. Anyone who finds the client album URL can iterate 10,000 PINs automatically. No rate limiting is mentioned. |
| 6 | **No defined photo storage lifecycle** | Where do photos go? How long are they kept? Who owns them legally? Without answers, you will face GDPR/Indonesian UU PDP compliance issues and surprise storage costs. |
| 7 | **No offline/poor connectivity fallback** | Weddings happen in remote venues, basements, rooftops. No mention of upload queueing, retry logic, or offline camera mode. This is a broken core experience at exactly the worst moment. |
| 8 | **Demo routes feel disconnected** | `/demo/wedding` and `/demo/birthday` are listed but there's no spec on what they contain. A bad demo kills sales — especially for a managed service with no self-service trial. |
| 9 | **No notification system** | Clients have no way to know when guests have uploaded photos. The album is static until they log in manually. |
| 10 | **The tagline is descriptive, not emotional** | *"Kumpulkan setiap momen dalam satu album"* tells people *what* it does. Apple's tagline doesn't say "A phone with a camera." Lead with the feeling, not the function. |

---

### ② UX Risks

> [!WARNING]
> These are risks that could directly cause user abandonment or bad press.

**Camera Permission Friction (Critical)**
The browser camera permission dialog is jarring. It appears mid-flow before the guest understands context. Every guest who taps "Block" is permanently locked out on that browser session. The product needs a deliberate permission priming screen before triggering the native prompt.

**QR Scan → Camera in how many taps?**
The PRD implies: scan QR → event page → camera. That's 2 taps minimum. At a wedding reception, if a guest has to navigate 3 screens to take a photo, they won't. The magic number is: **scan → take photo in ≤ 1 tap**.

**Gallery without context feels cold**
A grid of photos with no names, no captions, no timestamps feels like a file browser, not a memory album. Every competing product that wins does so because they make the *browsing* experience emotional, not just functional.

**Front camera / selfie assumption**
The "front/rear switch" suggests no opinion on default camera direction. At events, 80% of guest photos should be of *other people* — not selfies. Default to rear camera. Have a product opinion.

**The `/albumcerita/album` access page has a naming conflict**
`/albumcerita/album` is the client login page. `/albumcerita/[slug]` is the guest page. If a client visits their own event page first, they'll be confused about where to log in. The information architecture leaks the seams.

**No empty states defined**
What does the gallery look like when 0 photos have been uploaded? What does the camera experience show when the photo limit is reached? Empty states are where most products fail emotionally.

---

### ③ Missing Requirements

- **Photo approval / moderation workflow** — who reviews flagged content?
- **Event types** (wedding, birthday, corporate) — UI/copy should adapt per type
- **Photo limit rules** — per guest, per event, enforced where (client-side or server)?
- **QR code placement spec** — size, print format, do they print table cards?
- **Album expiry policy** — does the album exist forever? 1 year? Client controls this?
- **Download quality** — do guests get original resolution? Compressed? Watermarked?
- **Simultaneous upload limit** — what if 200 guests upload at the same time?
- **Guest name/handle** — even a first name adds warmth ("Marco took this")
- **Real-time gallery refresh** — do new photos appear live, or only on page reload?
- **Analytics for admin** — event performance, uploads per hour, peak moments
- **Error states** — failed uploads, camera not supported, network drop

---

### ④ Scalability Concerns

**Storage**
A 200-guest wedding where each guest takes 5 photos at ~3MB each = **3GB per event**. At 50 events/month = 150GB/month. Plan for object storage (Supabase Storage / S3) with CDN from day one. Do not serve photos from origin.

**Concurrent writes**
A champagne toast moment will trigger 50–100 simultaneous uploads within 60 seconds. Your upload API must be async and queue-tolerant. Synchronous photo processing will fail here.

**Admin bottleneck**
The managed service model means every new client is a manual operation. By Month 3, if you're doing 20+ events/month, admin creation becomes your support backlog. Design the admin panel to be fast enough for a part-time operator — and plan the self-service unlock for V2.

**Database query patterns**
Photos queried by event slug will be the most common read pattern. Index on `event_id` from day one. Gallery queries without pagination will break above ~500 photos.

---

### ⑤ Security Concerns

> [!CAUTION]
> These are actual security vulnerabilities in the current design.

| Risk | Severity | Mitigation |
|------|----------|------------|
| 4-digit PIN brute force | 🔴 High | Rate limiting, lockout after 5 attempts, 6-digit PIN minimum |
| No upload validation | 🔴 High | Server-side MIME type checking, file size limit, virus scanning |
| Public QR = open upload | 🟠 Medium | Optional: event-time access window (event active during defined hours only) |
| Admin panel has no auth spec | 🔴 High | Admin must have proper auth (not just URL obscurity) — JWT + session |
| Guest uploads with no attribution | 🟡 Low | Fingerprint guests by device to enable removal requests |
| No HTTPS enforcement spec | 🟠 Medium | Camera API requires HTTPS — this must be stated as a requirement |
| Metadata on uploaded photos | 🟡 Low | Strip EXIF data server-side to protect guest location/device info |

---

### ⑥ Monetization Opportunities

> [!TIP]
> These are revenue levers you can add without breaking the managed service model.

1. **Tiered event packages** — Standard (100 photos), Premium (500 photos), Unlimited. Charge by tier.
2. **Print products** — Offer a physical photo book printed from the digital album. High margin, premium positioning.
3. **Extended storage** — Album access for 1 year (standard) vs. 5 years (premium). Storage as a subscription without being "a subscription."
4. **Live Photo Wall** — A venue display mode showing real-time uploads on a TV/projector. Upsell to the event planner.
5. **Branded QR packages** — Custom-designed QR table cards, envelope stickers, photo booth frames. Physical product sold alongside the digital service.
6. **Guest highlight reel** — A curated auto-generated "best moments" video delivered post-event.
7. **API access for event planners** — Once V2 self-service exists, charge event agencies for white-label or API access.
8. **Corporate event tier** — Separate pricing for corporate events (product launches, conferences) with logo removal and custom branding.

---

## Part II — Product Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AlbumCerita                            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Guest Layer │  │ Client Layer │  │   Admin Layer    │  │
│  │              │  │              │  │                  │  │
│  │ Event Page   │  │ Album Login  │  │ Event Management │  │
│  │ Camera       │  │ Gallery View │  │ Analytics        │  │
│  │ Gallery View │  │ Download     │  │ QR Generation    │  │
│  │ QR Scan      │  │ QR Download  │  │ Content Mod      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│          │                │                   │             │
│  ┌───────▼───────────────▼───────────────────▼───────────┐ │
│  │                    Next.js App                         │ │
│  │     (SSR Event Pages + CSR Camera + API Routes)        │ │
│  └────────────────────────┬──────────────────────────────┘ │
│                           │                                 │
│  ┌────────────────────────▼──────────────────────────────┐ │
│  │                   Supabase Backend                     │ │
│  │  PostgreSQL DB │ Auth (Admin) │ Storage │ Realtime     │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│  ┌────────────────────────▼──────────────────────────────┐ │
│  │              CDN + Object Storage                      │ │
│  │           (Supabase Storage / Cloudflare R2)           │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Stack Recommendation:**
- **Framework:** Next.js 14+ (App Router) — SSR for SEO on landing/demo, CSR for camera
- **Backend/DB:** Supabase (Postgres + Auth + Storage + Realtime subscriptions)
- **Storage:** Supabase Storage with Cloudflare CDN in front
- **Hosting:** Vercel (zero-config Next.js, edge functions for upload handling)
- **QR Generation:** `qrcode` npm package, server-side PNG generation
- **Camera:** MediaDevices Web API (no libraries needed)

---

## Part III — Information Architecture

```
AlbumCerita
│
├── Public
│   ├── Landing Page (/)
│   │   ├── Hero + CTA
│   │   ├── How It Works
│   │   ├── Mockup Showcase
│   │   └── Contact Section
│   │
│   ├── Demo (/demo)
│   │   ├── Wedding Demo (/demo/wedding)
│   │   └── Birthday Demo (/demo/birthday)
│   │
│   └── Guest Event (/albumcerita/[slug])
│       ├── Event Cover & Info
│       ├── Camera (/albumcerita/[slug]/camera)
│       └── Gallery (inline on event page)
│
├── Client (PIN-Protected)
│   ├── Album Login (/albumcerita/album)
│   └── Event Management (/albumcerita/manage/[eventId])
│       ├── Gallery View
│       ├── Photo Statistics
│       ├── Download Photos
│       ├── Copy Guest Link
│       └── Download QR Code
│
└── Admin (Auth-Protected)
    └── Admin Panel (/admin)
        ├── Event List
        ├── Create Event
        ├── Edit Event
        ├── Delete Event
        └── Event Detail
            ├── Gallery (with mod tools)
            ├── QR Management
            └── Analytics
```

---

## Part IV — Route Structure

| Route | Access | Auth | Description |
|-------|--------|------|-------------|
| `/` | Public | None | Landing page |
| `/demo` | Public | None | Demo index, redirects to /demo/wedding |
| `/demo/wedding` | Public | None | Live interactive wedding demo |
| `/demo/birthday` | Public | None | Live interactive birthday demo |
| `/albumcerita/[slug]` | Public | None | Guest event page |
| `/albumcerita/[slug]/camera` | Public | None | Fullscreen camera capture |
| `/albumcerita/album` | Public | None | Client login (Event ID + PIN) |
| `/albumcerita/manage/[eventId]` | Client | PIN Session | Client management dashboard |
| `/admin` | Private | JWT + Session | Admin login |
| `/admin/events` | Private | JWT + Session | Event list |
| `/admin/events/new` | Private | JWT + Session | Create event |
| `/admin/events/[id]` | Private | JWT + Session | Edit/view event |

> [!IMPORTANT]
> **Rename recommendation:** `/albumcerita/album` is semantically confusing — a guest might expect this to be an album view. Rename to `/masuk` or `/client-login` to clarify intent.

---

## Part V — Database Structure

### Table: `events`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
slug            text UNIQUE NOT NULL           -- "yuda-anggi"
event_id        text UNIQUE NOT NULL           -- "CRA-7K9X2P"
pin             text NOT NULL                  -- hashed bcrypt, 6 digits
name            text NOT NULL                  -- "Yuda & Anggi Wedding"
event_type      text NOT NULL                  -- 'wedding' | 'birthday' | 'corporate'
cover_image_url text
date            date
venue           text
welcome_message text
photo_limit     int DEFAULT 500               -- total per event
photos_per_guest int DEFAULT 10
is_active       bool DEFAULT true             -- QR scan enabled/disabled
active_from     timestamptz                   -- time-window access
active_until    timestamptz
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### Table: `photos`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id        uuid REFERENCES events(id) ON DELETE CASCADE
storage_path    text NOT NULL               -- path in Supabase Storage
thumbnail_path  text                        -- auto-generated 400px thumbnail
original_url    text NOT NULL
thumbnail_url   text
guest_token     text                        -- device fingerprint (not PII)
file_size       int
width           int
height          int
is_flagged      bool DEFAULT false
is_approved     bool DEFAULT true           -- false = pending moderation
uploaded_at     timestamptz DEFAULT now()
```

### Table: `admin_users`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
email           text UNIQUE NOT NULL
name            text
role            text DEFAULT 'admin'       -- 'admin' | 'superadmin'
created_at      timestamptz DEFAULT now()
```

### Table: `event_sessions`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id        uuid REFERENCES events(id)
session_token   text UNIQUE NOT NULL
session_type    text NOT NULL              -- 'client' | 'guest'
expires_at      timestamptz
created_at      timestamptz DEFAULT now()
```

### Key Indexes
```sql
CREATE INDEX idx_photos_event_id ON photos(event_id);
CREATE INDEX idx_photos_uploaded_at ON photos(event_id, uploaded_at DESC);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_event_id ON events(event_id);
```

---

## Part VI — Design System Recommendation

### Philosophical Alignment
The PRD's design references (Apple, Notion, Linear, luxury wedding) share one principle: **restraint creates luxury**. Every pixel that isn't there makes the ones that are feel more important.

### Typography Scale
```
Display:  Cormorant Garamond, 72px / 80px lh, weight 300 — hero moments only
H1:       Cormorant Garamond, 48px / 56px lh, weight 400
H2:       Cormorant Garamond, 32px / 40px lh, weight 400
H3:       Inter, 18px / 28px lh, weight 500 — section labels
Body:     Inter, 16px / 26px lh, weight 400
Small:    Inter, 13px / 20px lh, weight 400
Caption:  Inter, 11px / 16px lh, weight 500, letter-spacing 0.08em, UPPERCASE
```

### Color Tokens
```
--color-bg:           #FFFFFF    — page background
--color-surface:      #FAFAFA    — cards, inputs
--color-surface-raised: #F5F5F5  — hover states
--color-border:       #E5E5E5    — lines, dividers
--color-border-strong: #D4D4D4   — focused inputs
--color-text-primary: #171717    — primary text
--color-text-secondary: #737373  — secondary text
--color-text-tertiary: #A3A3A3   — placeholders
--color-accent:       #8F9B85    — sage green, sparingly
--color-accent-light: #F0F3EE    — accent tint for backgrounds
--color-danger:       #DC2626    — errors only
--color-white:        #FFFFFF
```

### Spacing System (4px base)
```
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-6:   24px
--space-8:   32px
--space-12:  48px
--space-16:  64px
--space-24:  96px
--space-32:  128px
```

### Component Patterns

**Primary Button**
- Background: `#171717` / Text: `#FFFFFF`
- Padding: `14px 28px` / Border-radius: `6px`
- Hover: slight opacity lift, no scale animation (Apple-like restraint)
- No shadows, no gradients

**Secondary Button**
- Background: transparent / Border: `1px solid #E5E5E5`
- Hover: `#FAFAFA` fill

**Card**
- Background: `#FAFAFA` / Border: `1px solid #E5E5E5`
- Border-radius: `12px` / Padding: `24px`
- No shadows — border, not shadow, defines depth

**Input**
- Border: `1px solid #E5E5E5` / Background: `#FFFFFF`
- Focus: border-color `#171717` (black), no box-shadow ring
- Font: Inter 16px

**Photo Grid**
- Masonry layout (CSS columns) for organic feel
- No white borders between photos — full-bleed tiles with 2px gap
- Lazy loading with blur-up placeholder

### Motion Principles
- Duration: **200ms** for micro (button hover), **350ms** for transitions
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Material's standard, actually works)
- Camera shutter: single `scale(0.97)` pulse, 150ms
- Page transitions: opacity fade only — no slide animations (too casual)
- **No bounce, no spring, no elastic** — this is editorial, not playful

---

## Part VII — Landing Page Wireframe

```
┌────────────────────────────────────────────────────────┐
│  [AlbumCerita]                         [Hubungi Kami]  │  ← Nav: logo left, single CTA right
├────────────────────────────────────────────────────────┤
│                                                        │
│                                                        │
│   ┌─────────────────────┐   ┌───────────────────┐     │
│   │                     │   │                   │     │  ← Two-column hero
│   │  Setiap tamu        │   │  [Phone Mockup]   │     │    Left: headline + CTA
│   │  membawa cerita.    │   │   showing event   │     │    Right: phone mockup
│   │  Kumpulkan semuanya │   │   page in action  │     │
│   │  dalam satu album.  │   │                   │     │
│   │                     │   │                   │     │
│   │  [Lihat Demo] [↗]   │   └───────────────────┘     │
│   │  [Hubungi Kami]     │                             │
│   └─────────────────────┘                             │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│   ─────────────── Bagaimana cara kerjanya? ──────────  │  ← Section title, centered, Cormorant
│                                                        │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐  ┌────┐  │
│   │    01    │   │    02    │   │    03    │  │ 04 │  │  ← 4 steps, horizontal scroll on mobile
│   │ Hubungi  │   │  Kami    │   │ Bagikan  │  │Sem │  │
│   │  Kami    │   │ Buatkan  │   │  QR ke   │  │Mo  │  │
│   │          │   │  Event   │   │  Tamu    │  │Ter │  │
│   └──────────┘   └──────────┘   └──────────┘  └────┘  │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│   ─────────────── Lihat sendiri ────────────────────── │
│                                                        │
│   ┌──────────────────────────────────────────────────┐ │
│   │         [DEMO: Wedding – Yuda & Anggi]           │ │  ← Embedded live demo iframe
│   │         [DEMO: Birthday – Dewi's 25th]          │ │    Tab switcher above
│   └──────────────────────────────────────────────────┘ │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│   ─────────────── Dibuat untuk momen ini ───────────── │
│                                                        │
│   Full-width photo collage grid (static, editorial)    │  ← Emotional/aspirational
│   3 rows × alternating sizes. Warm, natural tones.    │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│   ─── Siap mengabadikan momen Anda? ─────────────────  │
│                                                        │
│              [Hubungi Kami]                           │  ← Final CTA, centered
│                                                        │
├────────────────────────────────────────────────────────┤
│  AlbumCerita · Cerita Raya · 2026                      │  ← Minimal footer
└────────────────────────────────────────────────────────┘

NOTES:
- Zero nav links in header (except CTA) — no distractions
- Hero headline is Cormorant 64px with generous line-height
- "Hubungi Kami" links to WhatsApp Business (this is Indonesia — WhatsApp IS the CRM)
- The embedded demo tabs should be the ACTUAL running demo, not screenshots
```

---

## Part VIII — Event Page Wireframe

```
┌────────────────────────────────────────────────────────┐  ← Full screen, mobile-first
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │           [EVENT COVER PHOTO]                    │  │  ← Hero cover: full-width, 60vh
│  │                                                  │  │    Darkened gradient at bottom
│  │  ─────────────────────────────────────────────   │  │
│  │  Yuda & Anggi Wedding                            │  │
│  │  15 Juni 2026 · The Mulia, Bali                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │  ← Welcome card
│  │  Selamat datang! 🌿                              │  │    Subtle top-border in accent color
│  │  Terima kasih sudah hadir. Abadikan momen        │  │
│  │  ini dan bagikan ceritamu ke album bersama.      │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📷  Buka Kamera                                 │  │  ← PRIMARY ACTION — full width button
│  │      Ambil foto dan tambah ke album              │  │    Background: #171717, text: white
│  └──────────────────────────────────────────────────┘  │    This is THE most important tap
│                                                        │
│  ── 147 foto sudah dikumpulkan ──────────────────────  │  ← Live count (real-time via Supabase)
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [photo] [photo] [photo]                         │  │
│  │  [photo] [photo] [photo]                         │  │  ← Gallery grid: 3 columns
│  │  [photo] [photo] [photo]                         │  │    Masonry layout
│  │  [  Load more...  ]                              │  │    Lazy load, blur placeholder
│  └──────────────────────────────────────────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘

NOTES:
- No navigation header — this is an immersive experience
- The camera button MUST be above the gallery fold on all phone sizes
- Photo count should update live (Supabase Realtime subscription)
- Tapping a photo opens a full-screen lightbox with swipe navigation
- No guest profile, no "who uploaded this" visible to other guests
- Empty state: "Jadilah yang pertama menambahkan foto!" with animated camera icon
```

---

## Part IX — Camera Experience Flow

```
FLOW: Event Page → Camera → Capture → Confirm → Return

STEP 1: Permission Priming Screen
┌─────────────────────────────┐
│                             │
│         📷                  │
│                             │
│   AlbumCerita butuh akses   │
│   kamera untuk mengambil    │
│   foto.                     │
│                             │
│   Foto langsung masuk ke    │
│   album bersama.            │
│                             │
│   [Izinkan Akses Kamera]    │  ← Triggers browser permission
│   [Tidak Sekarang]          │
│                             │
└─────────────────────────────┘
(Only shown if permission not yet granted)

STEP 2: Camera Viewfinder (Fullscreen)
┌─────────────────────────────┐
│                             │
│   [←]              [🔄]    │  ← Back button (left), flip camera (right)
│                             │
│                             │
│   ░░░░ LIVE VIEWFINDER ░░░░ │  ← Full screen camera feed, no borders
│                             │
│                             │
│                             │
│   ┌──────────┐              │
│   │ [thumb]  │   [  ◯  ]   │  ← Last photo thumbnail (left), shutter (center)
│   └──────────┘              │    Remaining: shown as text below shutter
│      7 foto tersisa         │
│                             │
└─────────────────────────────┘
NOTES:
- Default camera: REAR
- Interface is white on transparent overlay (no solid backgrounds)
- Shutter button: large (72px), ring design like stock camera apps
- Shutter tap: slight pulse animation (scale 0.97), satisfying click sound (optional)
- NO filters, NO timer, NO HDR controls — intentional minimalism

STEP 3: Upload State (Immediate)
- Photo captured → thumbnail shows immediately
- Uploading indicator on thumbnail (progress ring)
- User can take another photo immediately — no blocking
- Upload is background queued

STEP 4: Upload Confirmation (Toast)
┌─────────────────────────────┐
│  ✓  Foto berhasil ditambahkan ke album  │  ← Toast, top of screen, 2.5s
└─────────────────────────────┘

STEP 5: Photo Limit Reached
┌─────────────────────────────┐
│                             │
│         ✓                   │
│                             │
│   Album sudah penuh!        │
│   Semua momen sudah         │
│   terkumpul.                │
│                             │
│   [Lihat Album]             │
│                             │
└─────────────────────────────┘

ERROR STATES:
- Camera not supported: "Browser Anda tidak mendukung kamera. Silakan upload foto dari galeri."
- Upload failed: "Gagal mengunggah. Coba lagi?" with [Coba Lagi] button — retains the captured image
- Network offline: Captured photo queued, "Akan diunggah saat koneksi tersedia"
```

---

## Part X — Client Management Flow

```
STEP 1: Client Login (/albumcerita/album)
┌─────────────────────────────┐
│                             │
│         AlbumCerita         │  ← Cormorant, centered
│                             │
│   Masuk ke album Anda       │
│                             │
│   [ Event ID              ] │  ← e.g. CRA-7K9X2P — auto-uppercase
│   [ PIN                   ] │  ← 6-digit, numeric keyboard trigger
│                             │
│   [      Lihat Album      ] │
│                             │
│   ───────────────────────   │
│   Butuh bantuan? Hubungi    │
│   kami di WhatsApp          │  ← Always give them an out
│                             │
└─────────────────────────────┘

VALIDATION:
- Event ID: check exists in DB
- PIN: bcrypt compare, server-side
- On success: set short-lived session cookie → redirect to /albumcerita/manage/[eventId]
- On fail: "Event ID atau PIN tidak valid" (do NOT say which one is wrong — security)
- After 5 failed attempts: 15-minute lockout

STEP 2: Client Dashboard (/albumcerita/manage/[eventId])
┌─────────────────────────────────────────────────────────┐
│  Yuda & Anggi Wedding                    [Keluar] [↗]  │
│  15 Juni 2026 · The Mulia, Bali                        │
│─────────────────────────────────────────────────────────│
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  147        │  │  23         │  │  3.2 GB         │ │  ← Stat cards
│  │  Foto       │  │  Tamu       │  │  Ukuran Album   │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  [📥 Download Semua Foto]   [📋 Salin Link Tamu]   ││  ← Primary actions
│  │  [📱 Download QR Code]      [📊 Lihat Statistik]   ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ─── Foto Terbaru ────────────────────────────────────  │
│                                                         │
│  [photo grid — same masonry as guest view]              │
│                                                         │
└─────────────────────────────────────────────────────────┘

NOTES:
- "Download Semua Foto" = triggers a background zip job, sends download link
- "Salin Link Tamu" = copies /albumcerita/[slug] to clipboard, shows toast
- "Download QR Code" = downloads PNG of QR code optimized for print (300 DPI)
- "Lihat Statistik" = expands an analytics panel: uploads by hour chart
- "Keluar" clears session cookie
- Client CANNOT delete photos — only admin can
- Client CANNOT see guest tokens/fingerprints — privacy separation
```

---

## Part XI — MVP Roadmap

### Phase 0 — Foundation (Week 1–2)
*The decisions that are hardest to undo later.*

- [ ] Set up Next.js project with App Router
- [ ] Set up Supabase project (DB + Auth + Storage)
- [ ] Implement design system (tokens, typography, components)
- [ ] Define storage bucket policy (public read, authenticated write)
- [ ] Set up Vercel project + environment variables
- [ ] Implement admin auth (Supabase Auth email/password)

### Phase 1 — Core Guest Experience (Week 3–4)
*The thing guests will use at the event.*

- [ ] Event page (`/albumcerita/[slug]`) — cover, info, CTA
- [ ] Camera experience (`/albumcerita/[slug]/camera`) — permission flow, viewfinder, capture
- [ ] Photo upload to Supabase Storage with thumbnail generation
- [ ] Gallery view on event page — masonry grid, lazy load, lightbox
- [ ] Real-time photo count (Supabase Realtime)
- [ ] Photo limit enforcement (per event, server-validated)
- [ ] Upload error handling + retry logic

### Phase 2 — Admin Panel (Week 5)
*The internal tool for running the service.*

- [ ] Admin login (`/admin`)
- [ ] Event list with search/filter
- [ ] Create event form (name, slug, PIN, cover photo, limits, dates)
- [ ] Edit event form
- [ ] Delete event (with photo cleanup)
- [ ] QR code generation (PNG download, WhatsApp share)
- [ ] Event ID + PIN auto-generation
- [ ] Photo moderation (flag/remove per photo)

### Phase 3 — Client Management (Week 6)
*What clients see after their event.*

- [ ] Client login page (`/albumcerita/album`) — Event ID + PIN
- [ ] Server-side PIN validation with rate limiting
- [ ] Client dashboard (`/albumcerita/manage/[eventId]`)
- [ ] Download all photos (zip generation, async)
- [ ] Copy guest link
- [ ] Download QR code (print-ready PNG)
- [ ] Basic stats (photo count, approximate guest count)

### Phase 4 — Landing Page + Demo (Week 7)
*The thing that sells the product.*

- [ ] Landing page (`/`) — full design, no placeholders
- [ ] Demo event pages — pre-seeded with real photos
- [ ] `/demo/wedding` and `/demo/birthday` with unique covers and galleries
- [ ] WhatsApp contact integration
- [ ] SEO meta tags, OG images for social sharing
- [ ] Mobile responsive testing (Android Chrome, iOS Safari)

### Phase 5 — Polish + Security (Week 8)
*The difference between MVP and product.*

- [ ] EXIF data stripping on server
- [ ] Rate limiting on upload + PIN endpoints
- [ ] Session expiry on client access
- [ ] Upload MIME type validation (server-side only)
- [ ] File size limit enforcement
- [ ] HTTPS enforcement check
- [ ] Empty states for all gallery/camera views
- [ ] Toast notification system
- [ ] Cross-browser camera testing
- [ ] Performance audit (Lighthouse ≥ 90)
- [ ] First event with real users → collect feedback

---

## Key Open Questions for Decision

> [!IMPORTANT]
> These decisions should be made BEFORE coding begins, as they affect schema and architecture.

1. **Photo limit: per guest or per event?** The PRD says "remaining photo counter" which implies per-guest tracking. This requires guest fingerprinting (by device token stored in localStorage). Per-event limits are simpler. Choose one.

2. **Is the gallery visible to guests before they upload?** i.e., can a guest who hasn't taken any photos still browse the full event gallery? This is a design/business decision, not just a technical one.

3. **Should the demo pages allow actual photo uploads?** If yes, you need a demo event with a cleanup job. If no, the demo is a static mockup — which is weaker.

4. **What is the PIN length?** The PRD shows a 4-digit example. For security, I recommend 6 digits minimum. This is a breaking UX choice if changed post-launch.

5. **What is the album retention policy?** Is the gallery available indefinitely? This affects storage costs dramatically. Recommend: 12 months from event date, then archived/deleted.

6. **Should guest names be collected (even optionally)?** A first name makes the album warmer ("Foto oleh Marco"). Anonymous is technically simpler but emotionally colder.

7. **WhatsApp or web form for "Hubungi Kami"?** This determines whether you need a backend form or just a `wa.me` link. WhatsApp is correct for the Indonesian market.

---

*Review prepared by Antigravity — AlbumCerita Product Design Session, June 2026*
