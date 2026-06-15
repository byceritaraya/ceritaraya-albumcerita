-- ==========================================
-- AlbumCerita — Supabase Init Migration v1.1
-- Based on TECHNICAL_ARCHITECTURE_v1_FINAL.md
-- ==========================================

-- 1. ENUM DEFINITIONS
-- ==========================================
CREATE TYPE event_state AS ENUM ('draft', 'published', 'expired', 'archived');
CREATE TYPE admin_role AS ENUM ('admin', 'superadmin');

-- 2. TABLE CREATION & CONSTRAINTS
-- ==========================================

CREATE TABLE events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  event_id text UNIQUE NOT NULL,
  pin_hash text NOT NULL,
  name text NOT NULL,
  event_type text NOT NULL,
  state event_state DEFAULT 'draft' NOT NULL,
  cover_image_url text,
  event_date date,
  venue text,
  welcome_message text,
  photos_per_guest integer NOT NULL,
  max_contributors integer NOT NULL,
  retention_months integer NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT check_photos_per_guest CHECK (photos_per_guest IN (5, 10, 20, 36)),
  CONSTRAINT check_max_contributors CHECK (max_contributors IN (20, 50, 100, 9999)),
  CONSTRAINT check_retention_months CHECK (retention_months IN (1, 3, 6, 12))
);

CREATE TABLE photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  guest_token text NOT NULL,
  guest_name text NOT NULL,
  storage_path text NOT NULL,
  thumbnail_path text,
  original_url text NOT NULL,
  thumbnail_url text,
  file_size_bytes integer NOT NULL,
  width integer,
  height integer,
  is_hidden boolean DEFAULT false NOT NULL,
  deleted_at timestamptz,
  uploaded_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT check_guest_name_length CHECK (char_length(guest_name) BETWEEN 1 AND 50)
);

CREATE TABLE admin_users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  role admin_role DEFAULT 'admin' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE client_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  session_token text UNIQUE NOT NULL,
  ip_address text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE pin_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL,
  event_id text NOT NULL,
  succeeded boolean NOT NULL,
  attempted_at timestamptz DEFAULT now() NOT NULL
);

-- 3. TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. POSTGRESQL INDEXES
-- ==========================================
CREATE INDEX idx_photos_event_id ON photos(event_id);
CREATE INDEX idx_photos_event_id_uploaded_at ON photos(event_id, uploaded_at DESC);
CREATE INDEX idx_photos_guest_token ON photos(event_id, guest_token);
CREATE INDEX idx_photos_deleted_at ON photos(event_id, deleted_at);

CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_event_id ON events(event_id);
CREATE INDEX idx_events_expires_at ON events(expires_at);

CREATE UNIQUE INDEX idx_client_sessions_token ON client_sessions(session_token);
CREATE INDEX idx_client_sessions_expires_at ON client_sessions(expires_at);

CREATE INDEX idx_pin_attempts_ip ON pin_attempts(ip_address, attempted_at);
CREATE INDEX idx_pin_attempts_event_id ON pin_attempts(event_id);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_attempts ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ------------------------------------------
-- EVENTS: 
-- Public reads restricted to prevent enumeration.
-- ------------------------------------------
CREATE POLICY "Admins have full access to events" ON events 
  FOR ALL TO authenticated 
  USING (is_admin()) 
  WITH CHECK (is_admin());

-- ------------------------------------------
-- PHOTOS:
-- Public can view active visible photos of published events.
-- ------------------------------------------
CREATE POLICY "Public can view active visible photos of published events" ON photos 
  FOR SELECT TO public
  USING (
    deleted_at IS NULL 
    AND is_hidden = false
    AND EXISTS (
      SELECT 1 FROM events 
      WHERE id = photos.event_id 
      AND state = 'published'
    )
  );

CREATE POLICY "Admins have full access to photos" ON photos 
  FOR ALL TO authenticated 
  USING (is_admin()) 
  WITH CHECK (is_admin());

-- ------------------------------------------
-- ADMIN_USERS:
-- ------------------------------------------
CREATE POLICY "Admins can view their own profile" ON admin_users
  FOR SELECT TO authenticated 
  USING (id = auth.uid());

CREATE POLICY "Superadmins have full access" ON admin_users
  FOR ALL TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- ------------------------------------------
-- CLIENT_SESSIONS & PIN_ATTEMPTS:
-- ------------------------------------------
CREATE POLICY "Admins have full access to client_sessions" ON client_sessions
  FOR ALL TO authenticated 
  USING (is_admin()) 
  WITH CHECK (is_admin());

CREATE POLICY "Admins have full access to pin_attempts" ON pin_attempts
  FOR ALL TO authenticated 
  USING (is_admin()) 
  WITH CHECK (is_admin());

-- ==========================================
-- 6. STORAGE BUCKET SETUP & RLS
-- ==========================================

-- Insert the private bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('albumcerita_photos', 'albumcerita_photos', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
-- NOTE: We don't need public policies because the Next.js Server Actions
-- use the Service Role Key to upload, and use Signed URLs for delivery.
-- We only grant Admin access via RLS for dashboard moderation tools.
CREATE POLICY "Admins full access to albumcerita_photos" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'albumcerita_photos' AND is_admin())
  WITH CHECK (bucket_id = 'albumcerita_photos' AND is_admin());
