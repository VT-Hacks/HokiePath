-- Fix RLS policies for user_my_courses table
-- The issue is that auth.uid() returns a UUID but we're comparing with TEXT

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own courses" ON user_my_courses;
DROP POLICY IF EXISTS "Users can insert their own courses" ON user_my_courses;
DROP POLICY IF EXISTS "Users can update their own courses" ON user_my_courses;
DROP POLICY IF EXISTS "Users can delete their own courses" ON user_my_courses;

-- Create new policies with proper UUID comparison
CREATE POLICY "Users can view their own courses" ON user_my_courses
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own courses" ON user_my_courses
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own courses" ON user_my_courses
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own courses" ON user_my_courses
  FOR DELETE USING (auth.uid()::text = user_id);

