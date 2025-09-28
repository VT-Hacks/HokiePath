import { z } from 'zod';

export const courseQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .min(1)
    .max(100, { error: 'Search must not exceed 100 characters' })
    .optional(),

  subject: z
    .string()
    .trim()
    .min(1)
    .max(20, { error: 'Subject must not exceed 20 characters' })
    .optional(),

  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) =>
      typeof val === 'string' ? [val] : Array.isArray(val) ? val : []
    ),
  page: z
    .string()
    .transform(Number)
    .refine((val) => Number.isInteger(val) && val > 0, {
      error: 'Page must be a positive integer',
    })

    .optional(),

  limit: z
    .string()
    .transform(Number)
    .refine((val) => Number.isInteger(val) && val > 0 && val <= 100, {
      error: 'Limit must be between 1 and 100',
    })
    .optional(),
});

export const createCourseReviewSchema = z.object({
  course_id: z.uuid({ error: 'courseId must be a valid id' }),

  user_id: z.uuid({ error: 'userId must be a valid id' }),

  rating: z
    .number({ error: 'Rating must be a number' })
    .min(1, { error: 'Rating must be at least 1' })
    .max(5, { error: 'Rating must not exceed 5' }),

  difficulty: z.number().int().min(1).max(5),
  interest: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
  instructor: z.string().max(100).optional(),
  semester: z.string().max(100).optional(),
  workload: z.string().max(1000).optional(),
  attendance_required: z.boolean().nullable().optional(),
  grading_style: z.string().max(200).nullable().optional(),
});

export const tagSchema = z.object({
  course_id: z.uuid({ error: 'courseId must be a valid id' }),
  tag: z.string().min(3).max(30),
  source: z.enum(['ai-generated', 'manual']).default('manual'),
});

export const getCourseSuggestionsSchema = z.object({
  course_id: z.uuid(),
  limit: z
    .string()
    .transform(Number)
    .refine((val) => Number.isInteger(val) && val > 0 && val <= 20, {
      error: 'Limit must be between 1 and 20',
    })
    .default(5),
  code: z.string().optional(),
  min_similarity: z
    .string()

    .transform(Number)
    .refine((val) => !isNaN(val) && val >= 0 && val <= 1, {
      message: 'Min Similarity must be a number between 0 and 1',
    })
    .optional(),
});

export type courseSuggestionInput = z.infer<typeof getCourseSuggestionsSchema>;
export const updateCourseReviewSchema = createCourseReviewSchema.partial();
export const updateTagSchema = tagSchema.partial();

export type CourseQueryParams = z.infer<typeof courseQuerySchema>;

export const parseTags = (tags: any) => {
  let parsedTags: string[] = [];

  if (tags) {
    if (Array.isArray(tags)) {
      parsedTags = tags;
    } else if (typeof tags === 'string') {
      parsedTags = [tags];
    }
  }

  parsedTags = parsedTags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0 && tag.length <= 50);
  return parsedTags;
};
