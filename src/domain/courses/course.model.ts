import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '../../common/types/supabase';

export type Course = Tables<'courses'>;
export type Subject = Tables<'subjects'>;
export type CourseEmbedding = Tables<'course_embeddings'>;
export type CourseReview = Tables<'course_reviews'>;
export type CourseTag = Tables<'course_tags'>;

export type NewCourse = TablesInsert<'courses'>;
export type NewCourseReview = TablesInsert<'course_reviews'>;
export type NewCourseTag = TablesInsert<'course_tags'>;
export type NewCourseEmbedding = TablesInsert<'course_embeddings'>;
export type NewSubject = TablesInsert<'subjects'>;

export type UpdateCourse = TablesUpdate<'courses'>;
export type UpdateCourseReview = TablesUpdate<'course_reviews'>;
export type UpdateCourseTag = TablesUpdate<'course_tags'>;
export type UpdateCourseEmbedding = TablesUpdate<'course_embeddings'>;
export type UpdateSubject = TablesUpdate<'subjects'>;

export type RecommendationRow = {
  course_id: string;
  code: string;
  subject: string;
  title: string;
  similarity: number;
};
