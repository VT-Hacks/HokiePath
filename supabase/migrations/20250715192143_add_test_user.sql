-- Add test user for development
INSERT INTO users (id, auth_id, degree, major, track, graduation, role, interests)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  'Master of Science',
  'Industrial and Systems Engineering',
  'thesis',
  '2026',
  'user',
  ARRAY['systems engineering', 'data analytics', 'optimization']
) ON CONFLICT (id) DO NOTHING;
