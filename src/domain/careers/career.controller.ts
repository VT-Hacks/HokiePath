import { APIError } from '../../common/errors';
import {
  addUserTermCourseSchema,
  createCareerPlanSchema,
  addCareerPlanTermSchema,
  addCareerPlanCourseSchema,
  addCareerPlanEdgeSchema,
  selectCareerPlanSchema,
} from './career.schema';
import { CareerService } from './career.service';
import { Request, Response, NextFunction } from 'express';

export class CareerController {
  constructor(private readonly service: CareerService) {
    if (!service) {
      throw new APIError('Career service not provided');
    }
  }

  // ----- User Term Courses -----
  addUserCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = addUserTermCourseSchema.parse(req.body);
      const course = await this.service.addUserCourse(input);
      res.status(201).json(course);
    } catch (error) {
        console.log(error)
      return next(error);
    }
  };

  getUserTermCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id } = req.params;
      const courses = await this.service.repo.getUserTermCourses(user_id);
      const grouped: Record<string, any[]> = {};
  for (const uc of courses) {
    const term = uc.term || 'Unknown Term';
    if (!grouped[term]) grouped[term] = [];
    grouped[term].push(uc);
  }

  // Convert to array of { term, courses }
  const crs= Object.entries(grouped).map(([term, courses]) => ({
    term,
    courses
  }));

      res.status(200).json(crs);
    } catch (error) {
      return next(error);
    }
  };

  removeUserCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { term_course_id } = req.params;
      await this.service.repo.removeUserTermCourse(term_course_id);
      res.status(200).json({ message: 'Course removed successfully' });
    } catch (error) {
      return next(error);
    }
  };

  // ----- Career Plans -----
  createCareerPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createCareerPlanSchema.parse(req.body);
      const plan = await this.service.createCareerPlan(input);
      res.status(201).json(plan);
    } catch (error) {
      return next(error);
    }
  };

  getCareerPlans = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id } = req.params;
      console.log("user id")
      console.log(user_id)
      const plans = await this.service.repo.getCareerPlanFlow(user_id);
      res.status(200).json(plans);
    } catch (error) {
      return next(error);
    }
  };

  selectCareerPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { plan_id } = selectCareerPlanSchema.parse(req.params);
      await this.service.selectPlan(plan_id);
      res.status(200).json({ message: 'Career plan selected successfully' });
    } catch (error) {
      return next(error);
    }
  };

  // ----- Career Plan Terms -----
  addTerm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = addCareerPlanTermSchema.parse(req.body);
      const term = await this.service.addTermToPlan(input);
      res.status(201).json(term);
    } catch (error) {
      return next(error);
    }
  };

  addCourseToTerm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = addCareerPlanCourseSchema.parse(req.body);
      const course = await this.service.addCourseToTerm(input);
      res.status(201).json(course);
    } catch (error) {
      return next(error);
    }
  };

  addEdgeToTerm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = addCareerPlanEdgeSchema.parse(req.body);
      const edge = await this.service.addEdgeToTerm(input);
      res.status(201).json(edge);
    } catch (error) {
      return next(error);
    }
  };

  // ----- Flowchart -----
  getFlowChart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { plan_id } = req.params;
      const flow = await this.service.getFlowChart(plan_id);
      res.status(200).json(flow);
    } catch (error) {
      return next(error);
    }
  };
  generateCareerPlans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id, currentTermCourses } = req.body;

    if (!user_id) {
      throw new APIError('user_id and currentTermCourses[] are required');
    }

    const plans = await this.service.generateCareerPlans(user_id);
    res.status(201).json({
      message: 'Career plans generated successfully',
      plans
    });
  } catch (error) {
    console.error('Error generating career plans:', error);
    return next(error);
  }
};
}
