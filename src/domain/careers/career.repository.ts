// career.repository.ts
import { supabase } from '../../infrastructure/supabase';
import type {
  CareerPlan,
  CareerPlanTerm,
  CareerPlanCourse,
  CareerPlanEdge,
  UserTermCourse,
  NewCareerPlan,
  NewCareerPlanTerm,
  NewCareerPlanCourse,
  NewCareerPlanEdge,
  NewUserTermCourse,
  CareerPlanWithFlow,
} from './career.model';
import type { Course } from '../courses/course.model';

/**
 * Repository for career-plan related DB access.
 * Note: This file assumes:
 * - user_term_courses has a foreign key 'course_id' -> courses.id
 * - career_plan_courses has a foreign key 'course_id' -> courses.id
 * - A Postgres RPC function 'match_courses' exists for vector search
 */
export class CareerRepository {
  /** -------------------- User Term Courses -------------------- */
  async addUserTermCourse(data: NewUserTermCourse): Promise<UserTermCourse> {
    const { data: row, error } = await supabase
      .from('user_term_courses')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    console.log('User course added:', row);
    return row as UserTermCourse;
  }

  /**
   * Returns user term courses with an aliased "course" object populated from courses table.
   */
  async getUserTermCourses(userId: string): Promise<UserTermCourse[]> {
    const { data, error } = await supabase
      .from('user_term_courses')
      .select(`
        *,
        course:course_id (
          id,
          code,
          title,
          description,
          credits,
          prerequisites,
          corequisites,
          restrictions,
          contact_hours,
          subject_code
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return (data as UserTermCourse[]) || [];
  }

  async removeUserTermCourse(termCourseId: string): Promise<void> {
    const { error } = await supabase
      .from('user_term_courses')
      .delete()
      .eq('id', termCourseId);

    if (error) throw error;
  }

  /** -------------------- Vector Search Methods -------------------- */
  /**
   * Calls your match_courses rpc to perform vector search.
   * - queryEmbedding may be an array or a JSON-stringified array.
   * - excludeCourses is a list of course ids to remove from results.
   */
  async getRecommendedCourses(
    queryEmbedding: string | any,
    matchCount: number = 60,
    similarityThreshold: number = 0.2,
    excludeCourses: string[] = []
  ): Promise<Course[]> {
    try {
      // If the embedding was passed as a JSON string (service does JSON.stringify), try to parse it
      let embedding: any = queryEmbedding;
      if (typeof queryEmbedding === 'string') {
        try {
          embedding = JSON.parse(queryEmbedding);
        } catch {
          // if parsing fails, keep the string — RPC may accept JSON string as well
          embedding = queryEmbedding;
        }
      }

      // Build params for the RPC; adapt param names if your RPC expects slightly different names.
      const params: any = {
        query_embedding: embedding,
        match_count: matchCount,
        min_similarity: similarityThreshold,
        exclude_course_id: excludeCourses[0] ||null,
        filter: {}
      };

      const { data, error } = await supabase.rpc('match_courses', params);

      if (error) {
        console.error('Vector search error:', error);
        throw error;
      }

      // Ensure we return an array and cast to Course[]
      return (Array.isArray(data) ? (data) : [])as any as Course[] || [];
    } catch (error) {
      console.error('Error in getRecommendedCourses:', error);
      // Important: do not throw here — allow the service to fall back
      throw error;
    }
  }

  /**
   * Fallback: return courses from the same subject_code(s).
   * - departments -> array of subject_code strings
   * - excludeCourses is an array of course ids to filter out
   */
  async getFallbackCourses(
    departments: string[],
    excludeCourses: string[],
    limit: number = 60
  ): Promise<Course[]> {
    try {
      // Build the base select
      let query: any = supabase
        .from('courses')
        .select(`
          id,
          code,
          title,
          description,
          credits,
          prerequisites,
          corequisites,
          restrictions,
          contact_hours,
          subject_code
        `);

      if (departments && departments.length > 0) {
        query = query.in('subject_code', departments);
      }

      // Apply exclusion only when there are IDs to exclude
      if (excludeCourses && excludeCourses.length > 0) {
        // Supabase expects a Postgres-style list for the 'in' operator string form:
        // e.g. ("uuid1","uuid2")
        const idsString = `(${excludeCourses.map(id => `"${id}"`).join(',')})`;
        query = query.not('id', 'in', idsString);
      }

      const { data, error } = await query.limit(limit);

      if (error) {
        console.error('Error fetching fallback courses:', error);
        throw error;
      }

      // Map data to Course[]; add a default "similarity" if you rely on it
      const rows = (data || []) as any[];
      return rows.map(r => ({
        id: r.id,
        code: r.code,
        title: r.title,
        description: r.description,
        credits: r.credits,
        prerequisites: r.prerequisites,
        corequisites: r.corequisites,
        restrictions: r.restrictions,
        contact_hours: r.contact_hours,
        subject_code: r.subject_code,
        created_at: r.created_at ?? null,
        pathways: r.pathways ?? null,
        // optional metadata used by service
        // @ts-ignore
        similarity: (r.similarity ?? 0.5)
      })) as Course[];
    } catch (error) {
      console.error('Error in getFallbackCourses:', error);
      return [];
    }
  }

  /** -------------------- Career Plans -------------------- */
  async createCareerPlan(data: NewCareerPlan): Promise<CareerPlan> {
    const { data: row, error } = await supabase
      .from('career_plans')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating career plan:', error);
      throw error;
    }

    return row as CareerPlan;
  }

  async addCareerPlanTerm(data: NewCareerPlanTerm): Promise<CareerPlanTerm> {
    const { data: row, error } = await supabase
      .from('career_plan_terms')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating career plan term:', error);
      throw error;
    }

    return row as CareerPlanTerm;
  }

  async addCareerPlanCourse(data: NewCareerPlanCourse): Promise<CareerPlanCourse> {
    const { data: row, error } = await supabase
      .from('career_plan_courses')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating career plan course:', error);
      throw error;
    }

    return row as CareerPlanCourse;
  }

  async addCareerPlanEdge(data: NewCareerPlanEdge): Promise<CareerPlanEdge> {
    const { data: row, error } = await supabase
      .from('career_plan_edges')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating career plan edge:', error);
      throw error;
    }

    return row as CareerPlanEdge;
  }

  /** -------------------- Flowchart Retrieval -------------------- */
  /**
   * Retrieves a career plan and its terms, courses and edges.
   * Each career_plan_course is expanded to include the referenced course record under alias `course`.
   */
async getCareerPlanFlow(plan_id: string): Promise<CareerPlanWithFlow> {
  const { data: plans, error: planErr } = await supabase
    .from('career_plans')
    .select('*')
    .eq('id', plan_id)
    // .eq('selected', true )
    

  if (planErr) throw planErr;

  if (!plans || plans.length === 0) {
    throw new Error(`Career plan with id ${plan_id} not found`);
  }

  const plan = plans[0]; // <-- pick the first element

  const { data: terms, error: termErr } = await supabase
    .from('career_plan_terms')
    .select('*')
    .eq('career_plan_id', plan_id)
    .order('term_order', { ascending: true });

  if (termErr) throw termErr;

  const termsWithDetails = await Promise.all(
    (terms || []).map(async (term: any) => {
      const { data: courses, error: courseErr } = await supabase
        .from('career_plan_courses')
        .select('*, course:course_id ( id, code, title, description, subject_code )')
        .eq('career_plan_term_id', term.id);
      if (courseErr) throw courseErr;

      const { data: edges, error: edgeErr } = await supabase
        .from('career_plan_edges')
        .select('*')
        .eq('career_plan_term_id', term.id);
      if (edgeErr) throw edgeErr;

      return { ...term, courses: courses || [], edges: edges || [] };
    })
  );

  return { ...plan, terms: termsWithDetails }; // now plan is an object
}


  /** -------------------- Plan Selection -------------------- */
  async selectCareerPlan(plan_id: string): Promise<CareerPlan> {
    const { data, error } = await supabase
      .from('career_plans')
      .update({ selected: true })
      .eq('id', plan_id)
      .select()
      .single();

    if (error) throw error;
    return data as CareerPlan;
  }

  async unselectAllPlans(user_id: string): Promise<void> {
    const { error } = await supabase
      .from('career_plans')
      .update({ selected: false })
      .eq('user_id', user_id);
    if (error) throw error;
  }

  /** -------------------- Get User Plans -------------------- */
  /**
   * Returns all career plans for a user including nested terms and courses with expanded course records.
   */
  async getUserCareerPlans(userId: string): Promise<CareerPlan[]> {
    const { data, error } = await supabase
      .from('career_plans')
      .select(`
        *,
        career_plan_terms (
          *,
          career_plan_courses (
            *,
            course:course_id ( id, code, title, description, subject_code )
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as CareerPlan[]) || [];
  }

  /** -------------------- Utilities -------------------- */
  async deleteCareerPlan(plan_id: string): Promise<void> {
    const { error } = await supabase
      .from('career_plans')
      .delete()
      .eq('id', plan_id);
    if (error) throw error;
  }

  /**
   * Optional user lookup for extra context used by the service when generating embeddings.
   * If your repo already has a users method elsewhere, you can remove this; service handles absence gracefully.
   */
  async getUserById(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('users')
      .select('id, auth_id, degree, major, track, graduation, interests')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('getUserById warning:', error);
      return null;
    }

    return data || null;
  }
}
