export type UserTermCourse = {
  id: string;
  user_id: string;
  course_id: string;
  term: string;
  created_at: string;
};

export type CareerPlan = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  selected: boolean;
  created_at: string;
};

export type CareerPlanTerm = {
  id: string;
  career_plan_id: string;
  term_order: number;
  term_name: string;
};

export type CareerPlanCourse = {
  id: string;
  career_plan_term_id: string;
  course_id: string;
  required: boolean;
  reason?: string;
};
