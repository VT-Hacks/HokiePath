-- Temporarily disable RLS for development mode
-- This allows the mock user to insert courses during development

-- Disable RLS on user_my_courses table for development
ALTER TABLE user_my_courses DISABLE ROW LEVEL SECURITY;

-- Note: In production, you should re-enable RLS and use proper authentication
-- To re-enable RLS, run: ALTER TABLE user_my_courses ENABLE ROW LEVEL SECURITY;

