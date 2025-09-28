import {
  APIError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../common/errors';
import { NewCourseReview, UpdateCourseReview } from '../course.model';
import { CourseQueryParams, courseSuggestionInput } from '../course.schema';
import { ICourseRepository } from '../course.types';

export class CourseService {
  private _repo: ICourseRepository;
  constructor(repo: ICourseRepository) {
    if (!repo) {
      throw new APIError('Course repository not passed');
    }
    this._repo = repo;
  }

  async getCourses(query: CourseQueryParams) {
    return await this._repo.findAll(query);
  }

  async getCourseDetails(code: string) {
    const course = await this._repo.findByCode(code);
    if (!course) throw new NotFoundError('Course not found.');
    return course;
  }
  async getSubjectCourses(subject: string) {
    return await this._repo.findCoursesBySubject(subject);
  }
  async getTags(courseId: string) {
    const tags = await this._repo.getCourseTags(courseId);
    if (!tags) throw new NotFoundError('Tags not found.');
    return tags;
  }
  async addTag(courseId: string, tag: string) {
    // Need to verify whether tag been added is Appropriate
    return await this._repo.addCourseTag({
      course_id: courseId,
      tag,
      source: 'manual',
    });
  }

  async removeTag(courseId: string, tag: string) {
    await this._repo.removeCourseTag(courseId, tag);
  }
  async getReviews(courseId: string) {
    const [stats, reviews] = await Promise.all([
      this._repo.getCourseReviewsStats(courseId),
      this._repo.getCourseReviews(courseId),
    ]);
    return { stats, reviews };
  }

  async submitReview(data: NewCourseReview) {
    // Ensure user exists in database (for development/testing)
    await this._repo.ensureUserExists(data.user_id);
    
    const reviewExists = await this._repo.getUserCourseReview(
      data.course_id,
      data.user_id
    );
    if (reviewExists)
      throw new ValidationError('User has already reviewed this course.');
    return await this._repo.addCourseReview(data);
  }

  async updateReview(reviewId: string, updates: UpdateCourseReview) {
    const { user_id } = updates;
    const reviewExists = await this._repo.getReviewById(reviewId);
    if (!reviewExists) throw new NotFoundError("Review doen't exists.");
    if (reviewExists.user_id !== user_id) {
      throw new ForbiddenError('You are not allowed to update this review.');
    }
    return await this._repo.updateCourseReview(reviewId, updates);
  }

  async deleteReview(reviewId: string, userId: string) {
    const reviewExists = await this._repo.getReviewById(reviewId);
    if (!reviewExists) throw new NotFoundError("Review doen't exists.");
    if (reviewExists.user_id !== userId) {
      throw new ForbiddenError('You are not allowed to delete this review.');
    }
    await this._repo.deleteCourseReview(reviewId);
  }

  async getUserCourseReview(courseId: string, userId: string) {
    const reviews = await this._repo.getUserCourseReview(courseId, userId);
    if (!reviews) throw new NotFoundError('Reviews not found');
    return reviews;
  }
  async getUserReviews(userId: string) {
    return await this._repo.getUserReviews(userId);
  }
  async getCourseStatistics(courseId: string) {
    return await this._repo.getCourseReviewsStats(courseId);
  }

  // Embeddings
  async getCourseSuggestions(data: courseSuggestionInput) {
    const { course_id, limit, code, min_similarity } = data;

    const embedding = await this._repo.findCourseEmbedding(course_id);
    if (!embedding) throw new NotFoundError('Course Embedding not found!');
    const results = await this._repo.findCourseRecommendations(
      course_id,
      embedding,
      limit,
      min_similarity,
      {
        code,
      }
    );
    return results;
  }
}
