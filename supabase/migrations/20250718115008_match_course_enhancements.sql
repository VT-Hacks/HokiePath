DROP FUNCTION IF EXISTS match_courses(VECTOR, INT, JSONB);
DROP FUNCTION IF EXISTS match_courses(VECTOR, INT);
DROP FUNCTION IF EXISTS match_courses(VECTOR);

CREATE OR REPLACE FUNCTION match_courses(
  query_embedding VECTOR(768),
  match_count INT DEFAULT 5,
  filter JSONB DEFAULT '{}',
  exclude_course_id UUID DEFAULT NULL,
  probes INT DEFAULT 6,
  min_similarity REAL DEFAULT 0.7
)
RETURNS TABLE (
  course_id UUID,
  code TEXT,
  subject TEXT,
  title TEXT,
  similarity REAL
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  PERFORM set_config('ivfflat.probes',probes::TEXT, true);
  RETURN QUERY 
  SELECT
  
  c.id AS course_id,
  c.code AS code,
  c.subject_code AS subject,
  c.title AS title,

  (1 - (e.embedding <=> query_embedding))::REAL AS similarity
  FROM course_embeddings e JOIN courses c on e.course_id=c.id 
  WHERE (filter IS NULL OR e.metadata @> filter)
  AND (exclude_course_id IS NULL OR c.id != exclude_course_id)
  AND (1 - (e.embedding <=> query_embedding)) >= min_similarity
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
 
$$;