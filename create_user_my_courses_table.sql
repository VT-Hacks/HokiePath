-- Create user_my_courses table on hosted Supabase
-- Run this SQL in the Supabase SQL Editor

-- Create the user_my_courses table
CREATE TABLE IF NOT EXISTS public.user_my_courses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_code TEXT NOT NULL,
  course_title TEXT NOT NULL,
  course_subject TEXT,
  course_credits INTEGER,
  course_description TEXT,
  similarity_score DECIMAL(5,4),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_my_courses_user_id ON public.user_my_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_my_courses_course_code ON public.user_my_courses(course_code);

-- Disable RLS for development (temporarily)
-- This allows the mock user to insert courses during development
ALTER TABLE public.user_my_courses DISABLE ROW LEVEL SECURITY;

-- Note: In production, you should re-enable RLS with proper authentication
-- To re-enable RLS, run: ALTER TABLE public.user_my_courses ENABLE ROW LEVEL SECURITY;
