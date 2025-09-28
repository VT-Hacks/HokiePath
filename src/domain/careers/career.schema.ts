import { z } from 'zod';

// --------------------
// User Term Courses
// --------------------
export const addUserTermCourseSchema = z.object({
  user_id: z.string().uuid(),
  course_id: z.string().uuid(),
  term: z.string(),
});
export type AddUserTermCourseDTO = z.infer<typeof addUserTermCourseSchema>;

// --------------------
// Career Plans
// --------------------
export const createCareerPlanSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
});
export type CreateCareerPlanDTO = z.infer<typeof createCareerPlanSchema>;

export const selectCareerPlanSchema = z.object({
  plan_id: z.string().uuid(),
});
export type SelectCareerPlanDTO = z.infer<typeof selectCareerPlanSchema>;

// --------------------
// Career Plan Terms
// --------------------
export const addCareerPlanTermSchema = z.object({
  career_plan_id: z.string().uuid(),
  term_order: z.number().int(),
  term_name: z.string(),
});
export type AddCareerPlanTermDTO = z.infer<typeof addCareerPlanTermSchema>;

// --------------------
// Career Plan Courses
// --------------------
export const addCareerPlanCourseSchema = z.object({
  career_plan_term_id: z.string().uuid(),
  course_id: z.string().uuid(),
  required: z.boolean().optional().default(true),
  reason: z.string().optional(),
});
export type AddCareerPlanCourseDTO = z.infer<typeof addCareerPlanCourseSchema>;

// --------------------
// Career Plan Edges (for flowchart visualization)
// --------------------
export const addCareerPlanEdgeSchema = z.object({
  career_plan_term_id: z.string(),
  from_course_id: z.string(),
  to_course_id: z.string(),
});

export const CareerPlanSchema = z.object({
  plans: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      terms: z.array(
        z.object({
          term_order: z.number(),
          term_name: z.string(),
          courses: z.array(
            z.object({
              course_id: z.string(),
              reason: z.string(),
            })
          )
        })
      )
    })
  )
});

export type AddCareerPlanEdgeDTO = z.infer<typeof addCareerPlanEdgeSchema>;
