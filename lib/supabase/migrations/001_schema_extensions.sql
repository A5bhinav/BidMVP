-- Migration 001: Add missing columns to existing tables
-- This extends your existing schema without breaking anything
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Extend User table
-- ============================================

-- Add year column (1-5 for college years)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS year INTEGER CHECK (year >= 1 AND year <= 5);

-- Add rushing toggle (for PNM visibility)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS rushing BOOLEAN DEFAULT FALSE;

-- Add school_id as foreign key (optional - if migrating from text school field)
-- Note: This is nullable to allow gradual migration
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS school_id TEXT REFERENCES school(id);

-- Add index on school_id for faster queries
CREATE INDEX IF NOT EXISTS idx_user_school_id ON "User"(school_id);

-- Add index on rushing for PNM queries
CREATE INDEX IF NOT EXISTS idx_user_rushing ON "User"(rushing) WHERE rushing = TRUE;

-- ============================================
-- 2. Extend event table
-- ============================================

-- Add description field
ALTER TABLE event 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add event_type (party, mixer, rush, invite-only)
ALTER TABLE event 
ADD COLUMN IF NOT EXISTS event_type TEXT CHECK (event_type IN ('party', 'mixer', 'rush', 'invite-only'));

-- Add end_time (currently only has date/start_time)
ALTER TABLE event 
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;

-- Add visibility setting
ALTER TABLE event 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'invite-only', 'rush-only'));

-- Add QR code field (unique per event)
ALTER TABLE event 
ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE;

-- Add location field (required for automatic check-out)
ALTER TABLE event 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add geocoded coordinates cache for location (for automatic check-out)
-- NUMERIC(11, 8) allows for 3 digits before decimal (for -180 longitude) + 8 decimal places
ALTER TABLE event 
ADD COLUMN IF NOT EXISTS location_lat NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS location_lng NUMERIC(11, 8);

-- Add index for location coordinate queries
CREATE INDEX IF NOT EXISTS idx_event_location_coords 
ON event(location_lat, location_lng) 
WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- Add line_skip_price field (optional)
ALTER TABLE event 
ADD COLUMN IF NOT EXISTS line_skip_price NUMERIC(10, 2);

-- Add max_bids field (optional - NULL means unlimited)
ALTER TABLE event 
ADD COLUMN IF NOT EXISTS max_bids INTEGER CHECK (max_bids IS NULL OR max_bids > 0);

-- Add comment explaining max_bids
COMMENT ON COLUMN event.max_bids IS 'Maximum number of bids that can be sold for this event. NULL means unlimited.';

-- Add updated_at column for tracking when events are modified
ALTER TABLE event 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Set updated_at for existing events (if any) to their created_at or current timestamp
UPDATE event 
SET updated_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;

-- Add index on event_type for filtering
CREATE INDEX IF NOT EXISTS idx_event_type ON event(event_type);

-- Add index on visibility for filtering
CREATE INDEX IF NOT EXISTS idx_event_visibility ON event(visibility);

-- Make capacity column nullable (not needed for event creation)
ALTER TABLE event 
ALTER COLUMN capacity DROP NOT NULL;

-- Add comment explaining capacity is optional
COMMENT ON COLUMN event.capacity IS 'Capacity is optional and not currently used in event creation';

-- ============================================
-- 3. Extend fraternity table
-- ============================================

-- Add type (fraternity, sorority, other)
ALTER TABLE fraternity 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('fraternity', 'sorority', 'other'));

-- Add photo_url for group photos
ALTER TABLE fraternity 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add verified status (for manual verification)
ALTER TABLE fraternity 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Add index on verified for filtering
CREATE INDEX IF NOT EXISTS idx_fraternity_verified ON fraternity(verified) WHERE verified = TRUE;

-- ============================================
-- 4. Extend checkin table
-- ============================================

-- Add checked_out_at timestamp
ALTER TABLE checkin 
ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMP;

-- Add is_checked_in boolean flag
ALTER TABLE checkin 
ADD COLUMN IF NOT EXISTS is_checked_in BOOLEAN DEFAULT TRUE;

-- Add entry_method (approved, qr_scan, manual)
ALTER TABLE checkin 
ADD COLUMN IF NOT EXISTS entry_method TEXT CHECK (entry_method IN ('approved', 'qr_scan', 'manual'));

-- Add location tracking columns for geolocation-based automatic check-out
ALTER TABLE checkin 
ADD COLUMN IF NOT EXISTS last_location_lat NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS last_location_lng NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMP;

-- Add index on is_checked_in for live attendee queries
CREATE INDEX IF NOT EXISTS idx_checkin_is_checked_in ON checkin(is_checked_in) WHERE is_checked_in = TRUE;

-- Add index on event_id + is_checked_in for event attendee queries
CREATE INDEX IF NOT EXISTS idx_checkin_event_checked ON checkin(event_id, is_checked_in);

-- Add index for location tracking queries
CREATE INDEX IF NOT EXISTS idx_checkin_location_tracking 
ON checkin(event_id, user_id, last_location_at) 
WHERE is_checked_in = TRUE AND last_location_lat IS NOT NULL;

-- ============================================
-- 5. Event updated_at trigger
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS event_updated_at ON event;

-- Create trigger that fires before UPDATE
CREATE TRIGGER event_updated_at
BEFORE UPDATE ON event
FOR EACH ROW
EXECUTE FUNCTION update_event_updated_at();

-- ============================================
-- 6. Fix location coordinates precision (if columns already exist with wrong precision)
-- ============================================
-- NUMERIC(10, 8) is too small for longitude values (-180 to 180)
-- Update to NUMERIC(11, 8) to accommodate 3 digits before decimal (for -180) + 8 decimal places
-- This section fixes columns that may have been created with NUMERIC(10, 8) in earlier migrations

-- Fix location_lat and location_lng in event table (if they exist with wrong precision)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event' 
    AND column_name = 'location_lat' 
    AND data_type = 'numeric' 
    AND numeric_precision = 10
  ) THEN
    ALTER TABLE event ALTER COLUMN location_lat TYPE NUMERIC(11, 8);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event' 
    AND column_name = 'location_lng' 
    AND data_type = 'numeric' 
    AND numeric_precision = 10
  ) THEN
    ALTER TABLE event ALTER COLUMN location_lng TYPE NUMERIC(11, 8);
  END IF;
END $$;

-- Fix last_location_lat and last_location_lng in checkin table (if they exist with wrong precision)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checkin' 
    AND column_name = 'last_location_lat' 
    AND data_type = 'numeric' 
    AND numeric_precision = 10
  ) THEN
    ALTER TABLE checkin ALTER COLUMN last_location_lat TYPE NUMERIC(11, 8);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checkin' 
    AND column_name = 'last_location_lng' 
    AND data_type = 'numeric' 
    AND numeric_precision = 10
  ) THEN
    ALTER TABLE checkin ALTER COLUMN last_location_lng TYPE NUMERIC(11, 8);
  END IF;
END $$;

-- ============================================
-- Comments for reference
-- ============================================
-- All columns are added with IF NOT EXISTS to prevent errors if run multiple times
-- All new columns are nullable (except where defaults are set) to avoid breaking existing data
-- Indexes are added for performance on commonly queried fields
-- The updated_at trigger automatically updates the timestamp whenever an event is modified
-- Location coordinates use NUMERIC(11, 8) to support longitude values from -180 to 180

