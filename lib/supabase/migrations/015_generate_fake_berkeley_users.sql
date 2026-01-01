-- Migration 015: Generate fake Berkeley users for testing friends dashboard
-- This script creates test User entries with Berkeley as their school
-- Run this in your Supabase SQL Editor
-- 
-- NOTE: This only creates User table entries. You'll need to create corresponding
-- auth.users entries separately if you want to log in as these users.
-- Alternatively, use your app's signup flow to create accounts, then update
-- their User records with this script's structure.

DO $$
DECLARE
  berkeley_school_id TEXT;
  test_users_data TEXT[][] := ARRAY[
    ['Alice', 'Chen', 'alice.chen@berkeley.edu', 'F', '2'],
    ['Bob', 'Martinez', 'bob.martinez@berkeley.edu', 'M', '1'],
    ['Charlie', 'Singh', 'charlie.singh@berkeley.edu', 'M', '3'],
    ['Diana', 'Patel', 'diana.patel@berkeley.edu', 'F', '2'],
    ['Ethan', 'Kim', 'ethan.kim@berkeley.edu', 'M', '4'],
    ['Fiona', 'Rodriguez', 'fiona.rodriguez@berkeley.edu', 'F', '1'],
    ['George', 'Anderson', 'george.anderson@berkeley.edu', 'M', '3'],
    ['Hannah', 'Thompson', 'hannah.thompson@berkeley.edu', 'F', '2'],
    ['Isaac', 'Zhang', 'isaac.zhang@berkeley.edu', 'M', '4'],
    ['Julia', 'Williams', 'julia.williams@berkeley.edu', 'F', '1'],
    ['Kevin', 'Davis', 'kevin.davis@berkeley.edu', 'M', '3'],
    ['Luna', 'Garcia', 'luna.garcia@berkeley.edu', 'F', '2'],
    ['Marcus', 'Johnson', 'marcus.johnson@berkeley.edu', 'M', '5'],
    ['Nina', 'Lee', 'nina.lee@berkeley.edu', 'F', '1'],
    ['Oscar', 'Brown', 'oscar.brown@berkeley.edu', 'M', '4'],
    ['Priya', 'Kumar', 'priya.kumar@berkeley.edu', 'F', '2'],
    ['Quinn', 'Moore', 'quinn.moore@berkeley.edu', 'M', '3'],
    ['Rachel', 'Wilson', 'rachel.wilson@berkeley.edu', 'F', '1'],
    ['Sam', 'Taylor', 'sam.taylor@berkeley.edu', 'M', '4'],
    ['Tara', 'Jackson', 'tara.jackson@berkeley.edu', 'F', '2']
  ];
  user_record TEXT[];
  created_count INTEGER := 0;
  skipped_count INTEGER := 0;
  base_timestamp TIMESTAMP := NOW();
BEGIN
  -- Get Berkeley school_id (from your example: 'a0e0b1c8-aee7-4f5f-a522-591aad414f95')
  -- Try to find it by domain first
  SELECT id INTO berkeley_school_id
  FROM school
  WHERE domain = 'berkeley.edu'
  LIMIT 1;
  
  -- If not found by domain, try the ID from your example
  IF berkeley_school_id IS NULL THEN
    SELECT id INTO berkeley_school_id
    FROM school
    WHERE id = 'a0e0b1c8-aee7-4f5f-a522-591aad414f95';
  END IF;
  
  -- If still not found, use the ID from your example and create it
  IF berkeley_school_id IS NULL THEN
    berkeley_school_id := 'a0e0b1c8-aee7-4f5f-a522-591aad414f95';
    INSERT INTO school (id, name, domain)
    VALUES (berkeley_school_id, 'Berkeley University', 'berkeley.edu')
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'Created Berkeley school with ID: %', berkeley_school_id;
  ELSE
    RAISE NOTICE 'Using existing Berkeley school ID: %', berkeley_school_id;
  END IF;
  
  -- Loop through test users and create User entries
  FOREACH user_record SLICE 1 IN ARRAY test_users_data
  LOOP
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM "User" WHERE email = user_record[3]) THEN
      skipped_count := skipped_count + 1;
      RAISE NOTICE 'Skipped (already exists): %', user_record[3];
      CONTINUE;
    END IF;
    
    -- Create User entry (similar to your example INSERT)
    INSERT INTO "public"."User" (
      "id",
      "email",
      "phone",
      "name",
      "school",
      "gender",
      "profile_pic",
      "safety_score",
      "social_score",
      "created_at",
      "updated_at",
      "email_verified",
      "year",
      "rushing",
      "school_id",
      "email_confirmed_at"
    )
    VALUES (
      gen_random_uuid()::TEXT, -- Generate UUID
      user_record[3], -- email
      NULL, -- phone (null like your example)
      user_record[1] || ' ' || user_record[2], -- name
      'Berkeley University', -- school
      user_record[4], -- gender
      NULL, -- profile_pic (null initially, can add later)
      '0', -- safety_score
      '0', -- social_score
      base_timestamp, -- created_at
      base_timestamp, -- updated_at
      true, -- email_verified
      user_record[5]::INTEGER, -- year
      false, -- rushing
      berkeley_school_id, -- school_id
      base_timestamp -- email_confirmed_at
    );
    
    created_count := created_count + 1;
    RAISE NOTICE 'Created user: % (%)', user_record[1] || ' ' || user_record[2], user_record[3];
    
    -- Increment timestamp slightly for variety
    base_timestamp := base_timestamp + INTERVAL '1 minute';
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  Created: % users', created_count;
  RAISE NOTICE '  Skipped: % users (already exist)', skipped_count;
  RAISE NOTICE '  Total processed: % users', created_count + skipped_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NOTE: These are User table entries only.';
  RAISE NOTICE 'If you need to log in as these users, create auth accounts';
  RAISE NOTICE 'via your app signup flow or Supabase Auth API.';
  RAISE NOTICE '========================================';
END $$;
