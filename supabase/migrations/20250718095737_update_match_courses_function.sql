DROP FUNCTION IF EXISTS match_courses(VECTOR, INT, JSONB);


CREATE OR REPLACE FUNCTION match_courses(
  query_embedding VECTOR(768),
  match_count INT DEFAULT 5,
  filter JSONB DEFAULT '{}'
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
  PERFORM set_config('ivfflat.probes','6', true);
  RETURN QUERY 
  SELECT
  
  c.id AS course_id,
  c.code AS code,
  c.subject_code AS subject,
  c.title AS title,

  1 - (e.embedding <=> query_embedding) AS similarity
  FROM course_embeddings e JOIN courses c on e.course_id=c.id 
  WHERE e.metadata @> filter
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
 
$$;