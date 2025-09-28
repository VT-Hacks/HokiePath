import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '../../common/types/supabase';

// Core career plan entities
export type UserTermCourse = Tables<'user_term_courses'>;
export type CareerPlan = Tables<'career_plans'>;
export type CareerPlanTerm = Tables<'career_plan_terms'>;
export type CareerPlanCourse = Tables<'career_plan_courses'>;
export type CareerPlanEdge = Tables<'career_plan_edges'>;

// Insert types (for creating new records)
export type NewUserTermCourse = TablesInsert<'user_term_courses'>;
export type NewCareerPlan = TablesInsert<'career_plans'>;
export type NewCareerPlanTerm = TablesInsert<'career_plan_terms'>;
export type NewCareerPlanCourse = TablesInsert<'career_plan_courses'>;
export type NewCareerPlanEdge = TablesInsert<'career_plan_edges'>;

// Update types (for patching existing records)
export type UpdateUserTermCourse = TablesUpdate<'user_term_courses'>;
export type UpdateCareerPlan = TablesUpdate<'career_plans'>;
export type UpdateCareerPlanTerm = TablesUpdate<'career_plan_terms'>;
export type UpdateCareerPlanCourse = TablesUpdate<'career_plan_courses'>;
export type UpdateCareerPlanEdge = TablesUpdate<'career_plan_edges'>;

// Optional: aggregated types for your API responses
export type CareerPlanWithTerms = CareerPlan & {
  terms: (CareerPlanTerm & { courses: CareerPlanCourse[]; edges?: CareerPlanEdge[] })[];
};
export type CareerPlanTermWithCourses = Tables<'career_plan_terms'> & {
  courses: (Tables<'career_plan_courses'> & {
    course: Tables<'courses'>; // Optional: full course details
  })[];
  edges?: Tables<'career_plan_edges'>[];
};
export type CareerPlanWithFlow = Tables<'career_plans'> & {
  terms: CareerPlanTermWithCourses[];
};