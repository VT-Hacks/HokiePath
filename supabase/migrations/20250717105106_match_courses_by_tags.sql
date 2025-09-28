create or replace function match_courses_by_tags(tags text[])
returns table(course_id uuid)
language sql
as $$
  select distinct course_id
  from course_tags
  where exists (
    select 1
    from unnest(tags) as tag
    where course_tags.tag ilike '%' || tag || '%'
  );
$$;
