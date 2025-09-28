import { APIError } from '../../common/errors';
import {
  courseQuerySchema,
  createCourseReviewSchema,
  getCourseSuggestionsSchema,
  tagSchema,
  updateCourseReviewSchema,
} from './course.schema';
import { CourseService } from './services/course.service';
import { Request, Response, NextFunction } from 'express';
import { getExternalSummaryStreamed } from './services/summarise.service';
export class CourseController {
  constructor(private readonly service: CourseService) {
    if (!service) {
      throw new APIError('Course service not passed');
    }
  }

  getCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = courseQuerySchema.parse(req.query);
      const courses = await this.service.getCourses(query);
      res.status(200).json(courses);
    } catch (error) {
      return next(error);
    }
  };
  getCourseDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { code } = req.params;

      const course = await this.service.getCourseDetails(code);
      return res.status(200).json(course);
    } catch (error) {
      return next(error);
    }
  };
  getCoursesBySubject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { subject } = req.params;
      const courses = await this.service.getSubjectCourses(subject);
      res.status(200).json(courses);
    } catch (error) {
      return next(error);
    }
  };
  getTags = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { course_id } = req.params;
      const tags = await this.service.getTags(course_id);
      return res.status(200).json(tags);
    } catch (error) {
      return next(error);
    }
  };

  addTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { course_id } = req.params;

      const input = tagSchema.parse({ ...req.body, course_id });
      const result = await this.service.addTag(input.course_id, input.tag);
      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  };

  // async removeTag(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { id, tag } = req.params;
  //     await this.service.removeTag(id, tag);
  //     return res.status(204).send();
  //   } catch (error) {
  //     return next(error);
  //   }
  // }

  getReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { course_id } = req.params;
      const data = await this.service.getReviews(course_id);
      return res.status(200).json(data);
    } catch (error) {
      return next(error);
    }
  };

  submitReview = async (req: Request, res: Response, next: NextFunction) => {
    const { course_id } = req.params;
    try {
      const data = createCourseReviewSchema.parse({
        ...req.body,
        course_id,
      });
      const review = await this.service.submitReview(data);
      return res.status(201).json(review);
    } catch (error) {
      return next(error);
    }
  };

  updateReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { review_id } = req.params;
      const updates = updateCourseReviewSchema.parse(req.body);
      const updated = await this.service.updateReview(review_id, updates);
      return res.status(200).json(updated);
    } catch (error) {
      return next(error);
    }
  };
  deleteReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { review_id } = req.params;
      await this.service.deleteReview(review_id, req.body.user_id);
      return res.status(204).json({ message: 'Review deleted Successfully!' });
    } catch (error) {
      return next(error);
    }
  };

  getUserReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id } = req.params;
      const review = await this.service.getUserReviews(user_id);
      return res.status(200).json(review);
    } catch (error) {
      return next(error);
    }
  };
  getCourseStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { course_id } = req.params;
      const review = await this.service.getCourseStatistics(course_id);
      return res.status(200).json(review);
    } catch (error) {
      return next(error);
    }
  };

  // Enbeddings
  getCourseSuggestions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { course_id } = req.params;
      const input = getCourseSuggestionsSchema.parse({
        ...req.query,
        course_id,
      });
      const courses = await this.service.getCourseSuggestions(input);
      res.status(200).json(courses);
    } catch (error) {
      return next(error);
    }
  };
  courseAiSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.flushHeaders(); // Ensure headers are flushed immediately for SSE

      const { subject, code, title } = req.query;

      if (!subject || !code || !title) {
        // For SSE, send errors as events, not as a separate JSON response that closes the stream
        res.write(`event: error\n`);
        res.write(
          `data: ${JSON.stringify({
            error: 'Missing subject, code, or title query parameters.',
          })}\n\n`
        );
        res.end();
        return;
      }

      try {
        await getExternalSummaryStreamed(
          subject as string,
          code as string,
          title as string,
          (field, value) => {
            if (
              (typeof value === 'string' && value.trim() === '') ||
              (Array.isArray(value) && value.length === 0)
            ) {
              return;
            }

            res.write(`data: ${JSON.stringify({ field, value })}\n\n`);
          },
          () => {
            res.write(`data: ${JSON.stringify(null)}\n\n`);
            res.end();
            console.log(
              `Streaming complete for: ${subject} ${code} - ${title}`
            );
          },
          (error) => {
            console.error('Error during streaming:', error);

            res.write(`event: error\n`);
            res.write(
              `data: ${JSON.stringify({
                error:
                  error.message ||
                  'An unknown error occurred during streaming.',
              })}\n\n`
            );
            res.end(); // Close the connection on error
          }
        );
      } catch (error: any) {
        console.error('Unhandled error in API endpoint:', error);
        // Catch-all for unexpected errors before streaming starts or during setup
        res.write(`event: error\n`);
        res.write(
          `data: ${JSON.stringify({
            error: error.message || 'An unhandled server error occurred.',
          })}\n\n`
        );
        res.end();
      }
    } catch (error) {
      // This outer catch block might be for errors before headers are sent at all.
      // If an error occurs here, and headers haven't been sent, next(error) is fine.
      // If headers *have* been sent (unlikely for this specific block), this will also fail.
      // For robust SSE, it's often better to send error events within the stream.
      console.error('Top-level controller error:', error);
      if (!res.headersSent) {
        return next(error);
      } else {
        // If headers already sent, log and perhaps don't attempt to send another response
        console.error(
          'Headers already sent, cannot send error via next(error)'
        );
      }
    }
  };
}
