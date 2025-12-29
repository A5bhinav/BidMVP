-- Migration 010: Add test schools for development/testing
-- This script adds common universities to the school table for testing the campus search feature
-- Safe to run multiple times - will skip schools that already exist
-- Run this in your Supabase SQL Editor

DO $$
DECLARE
  schools_to_add TEXT[][] := ARRAY[
    ['Stanford University', 'stanford.edu'],
    ['Harvard University', 'harvard.edu'],
    ['MIT', 'mit.edu'],
    ['Yale University', 'yale.edu'],
    ['Princeton University', 'princeton.edu'],
    ['Columbia University', 'columbia.edu'],
    ['University of California, Berkeley', 'berkeley.edu'],
    ['University of California, Los Angeles', 'ucla.edu'],
    ['University of Southern California', 'usc.edu'],
    ['New York University', 'nyu.edu'],
    ['University of Texas at Austin', 'utexas.edu'],
    ['University of Michigan', 'umich.edu'],
    ['University of Pennsylvania', 'upenn.edu'],
    ['Duke University', 'duke.edu'],
    ['Northwestern University', 'northwestern.edu'],
    ['Cornell University', 'cornell.edu'],
    ['Brown University', 'brown.edu'],
    ['Dartmouth College', 'dartmouth.edu'],
    ['Vanderbilt University', 'vanderbilt.edu'],
    ['Georgetown University', 'georgetown.edu'],
    ['University of Chicago', 'uchicago.edu'],
    ['Johns Hopkins University', 'jhu.edu'],
    ['Carnegie Mellon University', 'cmu.edu'],
    ['University of Virginia', 'virginia.edu'],
    ['University of North Carolina at Chapel Hill', 'unc.edu'],
    ['University of Wisconsin-Madison', 'wisc.edu'],
    ['Penn State University', 'psu.edu'],
    ['Ohio State University', 'osu.edu'],
    ['Indiana University', 'indiana.edu'],
    ['Purdue University', 'purdue.edu']
  ];
  school_item TEXT[];
  existing_id TEXT;
  added_count INTEGER := 0;
  skipped_count INTEGER := 0;
BEGIN
  FOREACH school_item SLICE 1 IN ARRAY schools_to_add
  LOOP
    -- Check if school already exists by domain
    SELECT id INTO existing_id
    FROM school
    WHERE domain = LOWER(school_item[2]);
    
    -- Only insert if it doesn't exist
    IF existing_id IS NULL THEN
      INSERT INTO school (id, name, domain)
      VALUES (gen_random_uuid()::TEXT, school_item[1], LOWER(school_item[2]));
      added_count := added_count + 1;
      RAISE NOTICE 'Added: % (%)', school_item[1], school_item[2];
    ELSE
      skipped_count := skipped_count + 1;
      RAISE NOTICE 'Skipped (already exists): % (%)', school_item[1], school_item[2];
    END IF;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  Added: % schools', added_count;
  RAISE NOTICE '  Skipped: % schools (already exist)', skipped_count;
  RAISE NOTICE '  Total processed: % schools', added_count + skipped_count;
  RAISE NOTICE '========================================';
END $$;

