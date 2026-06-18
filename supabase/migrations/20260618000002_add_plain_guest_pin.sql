-- Add plain text guest PIN for prefilled URLs
ALTER TABLE events ADD COLUMN IF NOT EXISTS guest_pin text;
