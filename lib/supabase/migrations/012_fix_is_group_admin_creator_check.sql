-- Migration 012: Fix is_group_admin to check creator_id
-- This ensures that fraternity creators are recognized as admins
-- even if they're not in the group_members table yet

-- Update is_group_admin function to also check creator_id
CREATE OR REPLACE FUNCTION is_group_admin(p_user_id TEXT, p_group_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin in group_members table OR is the creator of the fraternity
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = p_user_id
    AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM fraternity
    WHERE id = p_group_id
    AND creator_id = p_user_id
  );
END;
$$;

