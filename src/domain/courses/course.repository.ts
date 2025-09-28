import { APIError, NotFoundError, ValidationError } from '../../common/errors';
import { Database } from '../../common/types/supabase';
import { supabase } from '../../infrastructure/supabase';
import {
  Course,
  NewCourseTag,
  CourseTag,
  CourseReview,
  NewCourseReview,
  UpdateCourseReview,
  RecommendationRow,
} from './course.model';
import { CourseQueryParams, courseSuggestionInput } from './course.schema';
import { ICourseRepository } from './course.types';
export class CourseRepository implements ICourseRepository {
  async findAll({
    search,
    subject,
    tags,
    page = 1,
    limit = 20,
  }: CourseQueryParams): Promise<{
    courses: Course[];
    total: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
  }> {
    let query = supabase.from('courses').select('*', { count: 'exact' });
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const escape = (val: string) => val.replace(/[,]/g, '');
    if (search) {
      query = query.or(
        `title.ilike.%${escape(search)}%,code.ilike.%${escape(search)}%`
      );
    }

    if (subject) {
      query = query.ilike('subject_code', subject);
    }

    if (tags?.length) {
      try {
        const { data, error } = await supabase.rpc('match_courses_by_tags', {
          tags,
        });
        if (error) {
          throw new APIError(error.message);
        }
        const courseIds = [...new Set(data?.map((t) => t.course_id))].filter(
          (id) => id !== null
        );
        if (!courseIds.length) {
          return {
            courses: [],
            total: 0,
            currentPage: 0,
            totalPages: 0,
            pageSize: limit,
          };
        }

        const paginatedCourseIds = courseIds.slice(from, to + 1); // slice is inclusive-exclusive, so add +1
        query = query.in('id', paginatedCourseIds);
      } catch (err: any) {
        throw new APIError('RPC failed: ' + err.message);
      }
    }

    query = query.range(from, to);
    const { data, error, count } = await query;
    if (error) throw new APIError(error.message);
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      courses: data ?? [],
      total,
      currentPage: page,
      totalPages,
      pageSize: limit,
    };
  }
  async findById(id: string): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .select('*, course_tags(tag)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new APIError(error.message);
    return data;
  }
  async findByCode(code: string): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .select('*, course_tags(tag)')
      .eq('code', code.toUpperCase())
      .maybeSingle();
    if (error) throw new NotFoundError('Course not found');
    return data;
  }
  async findCoursesBySubject(
    subject: string
  ): Promise<{ courses: Course[]; count: number }> {
    const {
      error,
      data: courses,
      count,
    } = await supabase
      .from('courses')
      .select('*', { count: 'exact' })
      .eq('subject_code', subject);
    if (error) throw new APIError(error.message);
    return {
      courses,
      count: count ?? 0,
    };
  }
  async getCourseTags(courseId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('course_tags')
      .select('tag')
      .eq('course_id', courseId);
    if (error) throw new APIError(error.message);
    return data?.map((t) => t.tag) || [];
  }
  async addCourseTag(tag: NewCourseTag): Promise<CourseTag> {
    const { data, error } = await supabase
      .from('course_tags')
      .insert(tag)
      .select()
      .single();
    if (error) throw new APIError(error.message);
    return data;
  }
  async removeCourseTag(courseId: string, tag: string): Promise<void> {
    const { error } = await supabase
      .from('course_tags')
      .delete()
      .eq('course_id', courseId)
      .eq('tag', tag);
    if (error) throw new APIError(error.message);
  }

  async getReviewById(reviewId: string): Promise<CourseReview | null> {
    const { data, error } = await supabase
      .from('course_reviews')
      .select('*')
      .eq('id', reviewId)
      .maybeSingle();
    if (error) throw new APIError(error.message);
    return data;
  }
  async getCourseReviews(courseId: string): Promise<CourseReview[]> {
    const { data, error } = await supabase
      .from('course_reviews')
      .select('*')
      .eq('course_id', courseId);
    if (error) throw new APIError(error.message);
    return data;
  }
  async getCourseReviewsStats(courseId: string): Promise<{
    rating: number;
    difficulty: number;
    interest: number;
    count: number;
  }> {
    const { data, error, count } = await supabase
      .from('course_reviews')
      .select('rating, interest, difficulty', { count: 'exact' })
      .eq('course_id', courseId);
    if (error) throw new APIError(error.message);

    const sum = data?.reduce(
      (acc, curr) => {
        acc.rating! += curr.rating || 0;
        acc.difficulty! += curr.difficulty || 0;
        acc.interest! += curr.interest || 0;
        return acc;
      },
      {
        rating: 0,
        difficulty: 0,
        interest: 0,
      }
    );
    return {
      rating: count ? sum.rating! / count : 0,
      difficulty: count ? sum.difficulty! / count : 0,
      interest: count ? sum.interest! / count : 0,
      count: count || 0,
    };
  }
  async ensureUserExists(userId: string): Promise<void> {
    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Error checking user existence: ${checkError.message}`);
    }

    // If user doesn't exist, create a default user
    if (!existingUser) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          auth_id: userId,
          degree: 'Bachelor',
          major: 'Computer Science',
          track: 'thesis',
          graduation: '2025',
          role: 'user',
          interests: ['programming', 'web development']
        });

      if (insertError) {
        throw new Error(`Error creating user: ${insertError.message}`);
      }
    }
  }

  async addCourseReview(review: NewCourseReview): Promise<CourseReview> {
    const { data, error } = await supabase
      .from('course_reviews')
      .insert(review)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
  async updateCourseReview(
    reviewId: string,
    update: UpdateCourseReview
  ): Promise<CourseReview> {
    const { data, error } = await supabase
      .from('course_reviews')
      .update(update)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
  async deleteCourseReview(reviewId: string): Promise<void> {
    const { error } = await supabase
      .from('course_reviews')
      .delete()
      .eq('id', reviewId);
    if (error) throw new Error(error.message);
  }
  async getUserCourseReview(
    courseId: string,
    userId: string
  ): Promise<CourseReview | null> {
    const { error, data } = await supabase
      .from('course_reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();
    if (error) throw new APIError(error.message);
    return data;
  }

  async getUserReviews(userId: string): Promise<CourseReview[] | null> {
    const { error, data } = await supabase
      .from('course_reviews')
      .select('*')
      .eq('user_id', userId);
    if (error) throw new APIError(error.message);
    return data;
  }

  // Embeddings
  async findCourseEmbedding(courseId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('course_embeddings')
      .select('embedding')
      .eq('course_id', courseId)
      .maybeSingle();
    if (error || !data) throw new NotFoundError('Embedding not found');
    return data.embedding;
  }

  async findCourseRecommendations(
    course_id: string,
    embedding: string,
    limit: number,
    min_similarity?: number,
    filter?: Partial<Course>
  ): Promise<RecommendationRow[]> {
    const params: any = {
      query_embedding: embedding,
      match_count: limit,
      filter: {},
      exclude_course_id: course_id,
      min_similarity,
    };

    if (filter) {
      if (filter.code) {
        params.filter.code = filter.code;
      }
    }

    const { data, error } = await supabase.rpc('match_courses', params);

    if (error) throw new APIError(error.message);
    return data ?? [];
  }
}
