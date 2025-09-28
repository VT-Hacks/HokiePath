import {
  Course,
  CourseReview,
  CourseTag,
  NewCourseReview,
  NewCourseTag,
  RecommendationRow,
  UpdateCourseReview,
} from './course.model';
import { CourseQueryParams } from './course.schema';

export interface ICourseRepository {
  findAll(params: CourseQueryParams): Promise<{
    courses: Course[];
    total: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
  }>;
  findById(id: string): Promise<Course | null>;
  findByCode(code: string): Promise<Course | null>;
  findCoursesBySubject(
    subject: string
  ): Promise<{ courses: Course[]; count: number }>;

  getCourseTags(courseId: string): Promise<string[]>;
  addCourseTag(tag: NewCourseTag): Promise<CourseTag>;
  removeCourseTag(courseId: string, tag: string): Promise<void>;

  getReviewById(reviewId: string): Promise<CourseReview | null>;
  getCourseReviews(courseId: string): Promise<CourseReview[]>;
  getCourseReviewsStats(courseId: string): Promise<{
    rating: number;
    difficulty: number;
    interest: number;
    count: number;
  }>;
  addCourseReview(review: NewCourseReview): Promise<CourseReview>;
  updateCourseReview(
    reviewId: string,
    data: UpdateCourseReview
  ): Promise<CourseReview>;
  deleteCourseReview(reviewId: string): Promise<void>;
  getUserCourseReview(
    courseId: string,
    userId: string
  ): Promise<CourseReview | null>;
  getUserReviews(userId: string): Promise<CourseReview[] | null>;
  ensureUserExists(userId: string): Promise<void>;

  // Embeddings
  findCourseEmbedding(courseId: string): Promise<string | null>;
  findCourseRecommendations(
    courseId: string,
    courseEmbedding: string,
    matchCount: number,
    minSimilarity?: number,
    filter?: Partial<Course>
  ): Promise<RecommendationRow[]>;
}
