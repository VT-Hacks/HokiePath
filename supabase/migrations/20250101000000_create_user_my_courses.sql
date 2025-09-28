-- Create user_my_courses table
CREATE TABLE IF NOT EXISTS user_my_courses (
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_my_courses_user_id ON user_my_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_my_courses_course_code ON user_my_courses(course_code);

-- Add RLS (Row Level Security) policies
ALTER TABLE user_my_courses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own courses
CREATE POLICY "Users can view their own courses" ON user_my_courses
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can only insert their own courses
CREATE POLICY "Users can insert their own courses" ON user_my_courses
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can only update their own courses
CREATE POLICY "Users can update their own courses" ON user_my_courses
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can only delete their own courses
CREATE POLICY "Users can delete their own courses" ON user_my_courses
  FOR DELETE USING (auth.uid()::text = user_id);

