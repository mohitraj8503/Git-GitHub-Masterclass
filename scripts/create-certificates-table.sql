-- Run this once in Supabase SQL Editor
-- Creates the certificates table for the Git & GitHub Masterclass verification system

CREATE TABLE IF NOT EXISTS certificates (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  certificate_id  TEXT UNIQUE NOT NULL,
  recipient_name  TEXT NOT NULL,
  enrollment_id   TEXT NOT NULL,
  workshop_name   TEXT NOT NULL DEFAULT 'Git & GitHub Masterclass',
  organized_by    TEXT NOT NULL DEFAULT 'Arka Jain University',
  collaborators   TEXT[] NOT NULL DEFAULT ARRAY['Microsoft Learn Student Ambassadors', 'GitHub'],
  completion_date TIMESTAMPTZ NOT NULL,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          TEXT NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID', 'REVOKED')),
  pdf_url         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by certificate_id (the QR/verify key)
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON certificates(certificate_id);

-- Enable Row Level Security
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Public can read any certificate (for /verify page — no login required)
CREATE POLICY "Public can verify certificates"
  ON certificates FOR SELECT
  USING (true);

-- Only service role (server-side) can insert/update (enforced via supabaseAdmin)
