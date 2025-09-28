-- User's current term courses
CREATE TABLE user_term_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  term TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Career plans for user
CREATE TABLE career_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Terms within a career plan
CREATE TABLE career_plan_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_plan_id UUID NOT NULL REFERENCES career_plans(id),
  term_order INT NOT NULL,
  term_name TEXT NOT NULL
);

-- Courses within each plan term
CREATE TABLE career_plan_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_plan_term_id UUID NOT NULL REFERENCES career_plan_terms(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  required BOOLEAN DEFAULT TRUE,
  reason TEXT
);

-- Optional: edges for flowchart visualization
CREATE TABLE career_plan_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_course_id UUID NOT NULL REFERENCES courses(id),
  to_course_id UUID NOT NULL REFERENCES courses(id),
  career_plan_term_id UUID NOT NULL REFERENCES career_plan_terms(id)
);
