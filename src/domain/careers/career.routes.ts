import { Router } from 'express';
import { CareerController } from './career.controller';
import { CareerRepository } from './career.repository';
import { CareerService } from './career.service';
const careerRepository = new CareerRepository();
const careerService = new CareerService(careerRepository);
const careerController = new CareerController(careerService);

const router = Router();

// ----- User Term Courses -----
router.post('/term-course', careerController.addUserCourse);
router.get('/term-courses/:user_id', careerController.getUserTermCourses);
router.delete('/term-course/:term_course_id', careerController.removeUserCourse);

// ----- Career Plans -----
router.post('/', careerController.createCareerPlan);
router.get('/:user_id/plans', careerController.getCareerPlans);
router.patch('/:plan_id/select', careerController.selectCareerPlan);

// ----- Career Plan Terms -----
router.post('/term', careerController.addTerm);
router.post('/term-course', careerController.addCourseToTerm);
router.post('/edge', careerController.addEdgeToTerm);

// ----- Flowchart -----
router.get('/:plan_id/flowchart', careerController.getFlowChart);

router.post('/generate', careerController.generateCareerPlans);


export default router;