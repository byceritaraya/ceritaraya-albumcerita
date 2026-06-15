# AlbumCerita Product Requirements Document

## Overview

AlbumCerita is a premium collaborative event photo album platform under the Cerita Raya ecosystem.

Guests scan a QR code, take photos, and contribute memories into a shared event album.

The product focuses on memories, stories, and shared moments.

This is not a disposable camera clone.

---

# Brand

Product Name:
AlbumCerita

Parent Brand:
Cerita Raya

Tagline:
Kumpulkan setiap momen dalam satu album.

---

# Business Model

Managed Service

Customers do not create events themselves.

Administrators create and manage events for customers.

No self-service SaaS experience in V1.

No subscription system.

No payment gateway.

No customer registration.

---

# Design Direction

Inspired by:

* Apple
* Notion
* Linear
* Satualbum
* Modern luxury wedding brands

---

# Visual Style

Design Principles:

* Minimal
* Premium
* Editorial
* Mobile First
* Timeless
* Elegant

Avoid:

* Generic SaaS dashboards
* Enterprise software aesthetics
* Neon colors
* Excessive gradients
* Heavy glassmorphism

---

# Color System

Background:
#FFFFFF

Surface:
#FAFAFA

Text:
#171717

Border:
#E5E5E5

Accent:
#8F9B85

Use accent color sparingly.

---

# Typography

Headings:
Cormorant Garamond

Body:
Inter

Large typography.

Generous whitespace.

---

# Landing Page

Hero:

AlbumCerita

Setiap tamu melihat cerita yang berbeda.
Kumpulkan semuanya dalam satu album.

Primary CTA:
Lihat Demo

Secondary CTA:
Hubungi Kami

Requirements:

* Premium phone mockups
* Event Page Mockup
* Camera Mockup
* Gallery Mockup

Visitors should understand the product within 5 seconds.

---

# How It Works

1. Hubungi Kami
2. Kami Buatkan Event Anda
3. Bagikan QR ke Tamu
4. Semua Momen Terkumpul

---

# Routes

/
/demo
/demo/wedding
/demo/birthday

/albumcerita/[slug]

/albumcerita/[slug]/camera

/albumcerita/album

/albumcerita/manage/[eventId]

/admin

---

# Event Structure

Example:

Event Name:
Yuda & Anggi Wedding

Slug:
yuda-anggi

Event ID:
CRA-7K9X2P

PIN:
8264

---

# Guest Experience

Guest URL:

/albumcerita/yuda-anggi

Features:

* Event Cover
* Event Information
* Camera Access
* Upload Photos
* Shared Gallery

---

# Client Access

Route:

/albumcerita/album

Fields:

* Event ID
* PIN

Button:

View Album

After validation:

Redirect to:

/albumcerita/manage/[eventId]

---

# Client Management

Features:

* View Gallery
* Download QR
* Copy Guest Link
* Download Photos
* Photo Statistics

No username.

No password.

Only Event ID and PIN.

---

# Camera Experience

Requirements:

* Fullscreen Camera
* Front / Rear Switch
* Capture Button
* Remaining Photo Counter
* Last Photo Thumbnail

Mobile First

Use browser camera APIs.

---

# Admin

Features:

* Event List
* Create Event
* Edit Event
* Delete Event
* Generate QR
* Generate Event ID
* Generate PIN

Use card layouts.

Avoid spreadsheet-like UI.

---

# MVP Scope

Include:

* Landing Page
* Demo Pages
* Admin Panel
* Event Pages
* Camera Experience
* Client Access Page
* QR Generation

Exclude:

* Payment Gateway
* Subscription
* Customer Registration
* AI Features
* Face Recognition

---

# Success Criteria

Users should feel:

"This is a beautiful place to collect memories."

Not:

"This is another SaaS dashboard."

# Final Product Decisions (Locked for MVP)

## Guest Experience

- Guest must enter their name before accessing the camera.
- Guest names are displayed in the gallery.
- Each event defines the maximum photos per guest.
- Available limits:
  - 5 photos
  - 10 photos
  - 20 photos
  - 36 photos

## Album Visibility

Default state:

Private

Flow:

Guest Upload
→ Client Reviews Photos
→ Client Publishes Album
→ Guests Can View Published Gallery

Guests cannot see all uploaded photos until the client publishes them.

## Client Access

Client URL:

/albumcerita/album

Access method:

- Event ID
- PIN

No account registration.
No username.
No password.

## Event Security

Event ID example:

CRA-7K9X2P

PIN:

6 digits

## Retention Policy

Client chooses retention period:

- 1 Month
- 3 Months
- 6 Months
- 12 Months

Each event stores:

expires_at

## Client Dashboard Features

Required:

- View all uploaded photos
- Hide photo
- Delete photo
- Publish album
- Copy guest link
- Download QR code
- Download all photos as ZIP

## Gallery

Two gallery states:

Private Gallery
(Client Only)

Public Gallery
(Visible to Guests After Publish)

## Business Model

Managed Service

Cerita Raya creates and manages events for customers.

Customers do not create events themselves.

No payment gateway in MVP.
No subscriptions in MVP.
No customer registration in MVP.