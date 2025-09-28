UPDATE course_embeddings SET course_id = (metadata->>'course_id')::uuid WHERE course_id IS NULL;

CREATE OR REPLACE FUNCTION set_course_id_from_metadata_trg ()
RETURNS TRIGGER AS 
$$
BEGIN 
  IF NEW.course_id IS NULL THEN 
    NEW.course_id := (NEW.metadata ->> 'course_id')::uuid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_course_id_from_metadata ON course_embeddings;

CREATE TRIGGER set_course_id_from_metadata
  BEFORE INSERT OR UPDATE OF metadata ON course_embeddings
  FOR EACH ROW
  WHEN (NEW.course_id IS NULL) 
  EXECUTE FUNCTION set_course_id_from_metadata_trg();