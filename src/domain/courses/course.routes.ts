import express from 'express';
import { CourseRepository } from './course.repository';
import { CourseService } from './services/course.service';
import { CourseController } from './course.controller';

const router = express.Router();

const courseRepository = new CourseRepository();
const courseService = new CourseService(courseRepository);
const courseController = new CourseController(courseService);

router.get('/', courseController.getCourses);
router.get('/:code', courseController.getCourseDetails);
router.get('/:subject/subject', courseController.getCoursesBySubject);

router.get('/:course_id/tags', courseController.getTags);
router.post('/:course_id/tags', courseController.addTag);

router.get('/:course_id/statistics', courseController.getCourseStatistics);
router.get('/reviews/:user_id/users', courseController.getUserReviews);
router.patch('/reviews/:review_id', courseController.updateReview);
router.delete('/reviews/:review_id', courseController.deleteReview);
router.get('/:course_id/reviews', courseController.getReviews);
router.post('/:course_id/reviews', courseController.submitReview);

router.get(
  '/:course_id/recommendations',
  courseController.getCourseSuggestions
);
router.get('/:course_id/summary', courseController.courseAiSummary);
export default router;
