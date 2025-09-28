// career.service.ts
import { CareerRepository } from './career.repository';
import type { 
  NewCareerPlan, NewCareerPlanTerm, NewCareerPlanCourse, NewCareerPlanEdge, NewUserTermCourse,
  CareerPlanWithFlow,
  CareerPlan
} from './career.model';
import { APIError } from '../../common/errors';
import { geminiModel } from '../../infrastructure/geimini';
import { embedder } from '../../infrastructure/embeddings'; // Your TogetherAI embedder
import { Course } from '../courses/course.model';

type GeneratedCareerPlan = {
  name: string;
  description?: string;
  terms: {
    term_order: number;
    term_name: string;
    courses: {
      course_id: string;
      reason?: string;
    }[];
  }[];
};

// interface Course {
//   course_id: string;
//   code: string;
//   title: string;
//   description: string;
//   credits: number;
//   prerequisites?: string[];
//   department: string;
//   level: string;
//   similarity?: number;
// }

export class CareerService {
  constructor(public repo = new CareerRepository()) {}

  addUserCourse(data: NewUserTermCourse) {
    return this.repo.addUserTermCourse(data);
  }

  createCareerPlan(data: NewCareerPlan) {
    return this.repo.createCareerPlan(data);
  }

  addTermToPlan(data: NewCareerPlanTerm) {
    return this.repo.addCareerPlanTerm(data);
  }

  addCourseToTerm(data: NewCareerPlanCourse) {
    return this.repo.addCareerPlanCourse(data);
  }

  addEdgeToTerm(data: { career_plan_term_id: string; from_course_id: string; to_course_id: string }) {
    return this.repo.addCareerPlanEdge({
      career_plan_term_id: data.career_plan_term_id,
      from_course_id: data.from_course_id,
      to_course_id: data.to_course_id,
    });
  }

  getFlowChart(plan_id: string) {
    return this.repo.getCareerPlanFlow(plan_id);
  }

  selectPlan(plan_id: string) {
    return this.repo.selectCareerPlan(plan_id);
  }

  /**
   * Generate 3 career plans for a user based on their current term courses
   * Now uses vector search to recommend real courses from database
   */
  async generateCareerPlans(userId: string): Promise<CareerPlan[]> {
    try {
      console.log(`🚀 Generating career plans for user: ${userId}`);

      // Step 1: Get user's current courses from database
      const currentCourses = await this.repo.getUserTermCourses(userId);
      
      if (!currentCourses || currentCourses.length === 0) {
        console.log('⚠️ User has no current courses, using fallback approach...');
        // For demo purposes, create some sample courses to generate plans
        const sampleCourses = [
          {
            course: {
              title: 'Introduction to Computer Science',
              description: 'Basic programming and computer science concepts'
            }
          }
        ];
        return this.generatePlansWithFallback(userId, sampleCourses);
      }

      console.log(`✅ Found ${currentCourses.length} current courses`);

      // Step 2: Get recommended courses using vector search
      const recommendedCourses = await this.getRecommendedCourses(currentCourses);
      
      if (!recommendedCourses || recommendedCourses.length === 0) {
        console.log('⚠️ No course recommendations found, using fallback approach...');
        return this.generatePlansWithFallback(userId, currentCourses);
      }

      console.log(`✅ Found ${recommendedCourses.length} recommended courses`);

      // Step 3: Generate career plans using AI with real courses
      try {
        const generatedPlans = await this.generatePlansWithAI(currentCourses, recommendedCourses);

        console.log(`✅ AI generated ${generatedPlans.length} plans`);
        console.log(generatedPlans)
        
        // Step 4: Save plans using existing repository methods
        const insertedPlans = await this.savePlansToDatabase(userId, generatedPlans);

        console.log("I am here")
        console.log(`🎉 Successfully created ${insertedPlans.length} career plans`);
        return insertedPlans;
      } catch (aiError: any) {
        if (aiError.message?.includes('quota') || aiError.message?.includes('429')) {
          console.log('⚠️ AI quota exceeded, using mock plans...');
          return await this.getMockPlans(userId);
        }
        throw aiError;
      }

    } catch (error) {
      console.error('❌ Error generating career plans:', error);
      throw error;
    }
  }

  private async generatePlansWithFallback(userId: string, sampleCourses: any[]): Promise<CareerPlan[]> {
    try {
      console.log('🔄 Using fallback career plan generation...');
      
      // Check if Gemini API quota is exceeded
      try {
        // Generate 3 diverse career plans using AI
        const plans = await this.generatePlansWithAI(sampleCourses, []);
        
        // Save plans to database
        const insertedPlans = await this.savePlansToDatabase(userId, plans);
        
        console.log(`🎉 Successfully created ${insertedPlans.length} fallback career plans`);
        return insertedPlans;
      } catch (aiError: any) {
        if (aiError.message?.includes('quota') || aiError.message?.includes('429')) {
          console.log('⚠️ AI quota exceeded, using mock plans...');
          return await this.getMockPlans(userId);
        }
        throw aiError;
      }
    } catch (error) {
      console.error('❌ Error in fallback generation:', error);
      // Return mock plans as final fallback
      return await this.getMockPlans(userId);
    }
  }

  private async getMockPlans(userId: string): Promise<CareerPlan[]> {
    try {
      console.log('🔄 Creating mock career plans in database...');
      
      const mockPlans = [
        {
          name: 'Aerospace Systems Engineering',
          description: 'This specialization focuses on the design, analysis, and optimization of aerospace systems including aircraft, spacecraft, and propulsion systems. It prepares students for careers in aerospace engineering, aircraft design, propulsion systems, and aerospace research and development.',
          terms: [
            {
              term_order: 1,
              term_name: 'Fall 2025',
              courses: [
                { course_id: 'cf5e2552-cac2-4f7a-8163-168e89c88f31', reason: 'Core aerospace systems course' },
                { course_id: '08b58141-7349-4f38-84c2-c5deb4290125', reason: 'Fundamental aerospace principles' }
              ]
            },
            {
              term_order: 2,
              term_name: 'Spring 2026',
              courses: [
                { course_id: '40b737ab-837b-42cd-a88e-37e798918f6b', reason: 'Advanced aerospace systems' },
                { course_id: '586ad280-be95-469a-878a-5ef6515eeb90', reason: 'Aerospace propulsion systems' }
              ]
            }
          ]
        },
        {
          name: 'Machine Learning & AI Systems',
          description: 'This specialization combines advanced machine learning techniques with systems engineering principles. It prepares students for careers in AI research, machine learning engineering, autonomous systems, and intelligent aerospace applications.',
          terms: [
            {
              term_order: 1,
              term_name: 'Fall 2025',
              courses: [
                { course_id: 'cf5e2552-cac2-4f7a-8163-168e89c88f31', reason: 'Advanced machine learning foundations' },
                { course_id: 'a0bf225c-e9f3-4a76-a1f3-1becc14019d0', reason: 'AI systems design' }
              ]
            },
            {
              term_order: 2,
              term_name: 'Spring 2026',
              courses: [
                { course_id: 'bbb2cb17-b01e-4384-8bee-f1580a5b1dc2', reason: 'Deep learning applications' },
                { course_id: 'c197ba31-9084-40c6-9daf-ae5bf69196aa', reason: 'AI system optimization' }
              ]
            }
          ]
        },
        {
          name: 'Aerospace-AI Integration',
          description: 'This specialization focuses on the intersection of aerospace engineering and artificial intelligence, preparing students for careers in autonomous aerospace systems, intelligent flight control, and AI-powered aerospace applications.',
          terms: [
            {
              term_order: 1,
              term_name: 'Fall 2025',
              courses: [
                { course_id: 'cf5e2552-cac2-4f7a-8163-168e89c88f31', reason: 'AI foundations for aerospace' },
                { course_id: '40b737ab-837b-42cd-a88e-37e798918f6b', reason: 'Aerospace systems integration' }
              ]
            },
            {
              term_order: 2,
              term_name: 'Spring 2026',
              courses: [
                { course_id: '586ad280-be95-469a-878a-5ef6515eeb90', reason: 'Autonomous aerospace systems' },
                { course_id: '8613e847-cc26-4fe4-b112-983a75cce9cd', reason: 'AI-powered flight control' }
              ]
            }
          ]
        }
      ];

      // Save mock plans to database
      const savedPlans = await this.savePlansToDatabase(userId, mockPlans);
      console.log(`✅ Successfully created ${savedPlans.length} mock career plans`);
      return savedPlans;
      
    } catch (error) {
      console.error('❌ Error creating mock plans:', error);
      // Return simple mock plans as final fallback
      return [
        {
          id: 'fallback-plan-1',
          user_id: userId,
          name: 'Aerospace Systems Engineering',
          description: 'This specialization focuses on the design, analysis, and optimization of aerospace systems including aircraft, spacecraft, and propulsion systems. It prepares students for careers in aerospace engineering, aircraft design, propulsion systems, and aerospace research and development.',
          selected: false,
          created_at: new Date().toISOString()
        },
        {
          id: 'fallback-plan-2', 
          user_id: userId,
          name: 'Machine Learning & AI Systems',
          description: 'This specialization combines advanced machine learning techniques with systems engineering principles. It prepares students for careers in AI research, machine learning engineering, autonomous systems, and intelligent aerospace applications.',
          selected: false,
          created_at: new Date().toISOString()
        },
        {
          id: 'fallback-plan-3',
          user_id: userId, 
          name: 'Aerospace-AI Integration',
          description: 'This specialization focuses on the intersection of aerospace engineering and artificial intelligence, preparing students for careers in autonomous aerospace systems, intelligent flight control, and AI-powered aerospace applications.',
          selected: false,
          created_at: new Date().toISOString()
        }
      ] as CareerPlan[];
    }
  }

  private async getRecommendedCourses(currentCourses: any[]): Promise<Course[]> {
    try {
      // Create a shorter search query to avoid token limits
      const searchQuery = currentCourses
        .map(uc => uc.course?.title || '')
        .filter(text => text.trim().length > 0)
        .slice(0, 3) // Limit to first 3 courses to reduce tokens
        .join(' ');

      if (!searchQuery.trim()) {
        throw new Error('No valid course data for search query');
      }

      console.log('🔍 Creating embedding for search...');

      // Get embedding using TogetherAI
      const queryEmbedding = await embedder.embedQuery(searchQuery);

      console.log('✅ Generated embedding, searching for similar courses...');

      // Get current course IDs to exclude them
      const currentCourseIds = currentCourses.map(uc => uc.course_id);

      // Use vector search function
      const recommendedCourses = await this.repo.getRecommendedCourses(
        JSON.stringify(queryEmbedding),
        30, // Reduced match_count to avoid token issues
        0.3, // Increased similarity_threshold
        currentCourseIds // exclude current courses
      );

    

      return recommendedCourses;

    } catch (error) {
      console.error('Error in vector search:', error);
      // Fallback to courses from same departments
      return this.getFallbackCourses(currentCourses);
    }
  }

  private async getFallbackCourses(currentCourses: any[]): Promise<Course[]> {
    console.log('⚠️ Using fallback course selection...');
    
    try {
      // Get departments from current courses
      const departments = [...new Set(
        currentCourses
          .map(uc => uc.course)
          .filter(dept => dept)
      )];

      const currentCourseIds = currentCourses.map(uc => uc.course_id);

      // Use repository method for fallback
      return this.repo.getFallbackCourses(
        departments.length > 0 ? departments : ['Computer Science'],
        currentCourseIds,
        60
      );

    } catch (error) {
      console.error('Error in fallback:', error);
      return [];
    }
  }

  private async generatePlansWithAI(currentCourses: any[], recommendedCourses: any[]): Promise<GeneratedCareerPlan[]> {
    const currentCoursesText = currentCourses
      .map(uc => `${uc.course?.code || ''} - ${uc.course?.title || ''}`)
      .filter(text => text.trim() !== ' - ')
      .join(', ');
console.log("recommended course")
      console.log(recommendedCourses[0])
    // Format available courses for AI
    const availableCoursesText = recommendedCourses
      .slice(0, 80) // Limit for token constraints
      .map((course, index) => {
        const prereqs = Array.isArray(course.prerequisites) && course.prerequisites.length > 0
          ? course.prerequisites.join(', ')
          : 'None';
        return `${index + 1}. ID: ${course.id}
   ID: ${course.course_id}
   Code: ${course.code}
   Title: ${course.title}
   Description: ${course.description}
   Credits: ${course.credits} | Department: ${course.subject_code}
   Prerequisites: ${prereqs}`;
      })
      .join('\n\n');

    const messages = [
      {
        role: 'system',
        content: 'You are an academic advisor AI. Generate exactly 3 distinct career specialization plans using ONLY the courses provided in the course catalog. Each plan should represent different career paths like Software Engineering, Data Science, Cybersecurity, etc.'
      },
      {
        role: 'user',
        content: `Student's current courses: ${currentCoursesText}

AVAILABLE COURSE CATALOG (use exact course_id values):
${availableCoursesText}

Create exactly 3 different career specialization tracks. Each should have 4 terms with 3-4 courses per term.

IMPORTANT: Use ONLY the course_id values from the catalog above.

Return strictly in JSON format:
Example format (use real course_id values from catalog above):
[
  {
    "name": "Software Engineering Track",
    "description": "Comprehensive software development focus",
    "terms": [
      {
        "term_order": 1,
        "term_name": "Spring 2026",
        "courses": [
          {
            "course_id": "exact-uuid-from-catalog-above",
            "reason": "Detailed explanation of why this course fits this track"
          }
        ]
      }
    ]
  }
]

Only return valid JSON, no extra text.`
      }
    ];

    console.log('🤖 Generating career plans with AI...');

    const response = await geminiModel.generate([messages]);
    let text = response.generations[0][0].text;



    // Clean the response
    text = this.cleanAIResponse(text);
console.log("cleaned")
    console.log(text)
    try {
      const plans = JSON.parse(text);

   
      const validatedPlans = this.validatePlans(plans, recommendedCourses);
      
      console.log(`✅ Validated ${validatedPlans.length} plans`);
      return validatedPlans;
      
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error);
      console.error('Raw response:', text);
      throw new Error('AI returned invalid JSON format');
    }
  }

  private cleanAIResponse(text: string): string {
    text = text.trim();
    
    // Remove markdown code blocks
    if (text.startsWith('```json')) text = text.substring(7);
    if (text.startsWith('```')) text = text.substring(3);
    if (text.endsWith('```')) text = text.substring(0, text.length - 3);
    
    // Extract JSON array
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      text = text.substring(jsonStart, jsonEnd + 1);
    }
    
    return text.trim();
  }

  private validatePlans(plans: any[], availableCourses: any): GeneratedCareerPlan[] {
 
    const validCourseIds = new Set(availableCourses.map((c:any) => c.course_id));
    return plans
      .map((plan, planIndex) => {
        if (!plan.name || !plan.terms || !Array.isArray(plan.terms)) {
          console.warn(`❌ Invalid plan structure at index ${planIndex}`);
          return null;
        }

        const validTerms = plan.terms
          .map((term: any) => {
            if (!term.courses || !Array.isArray(term.courses)) {
              return null;
            }

            const validCourses = term.courses.filter((course: any) => {
              console.log("Term Course")
              console.log(course)
              if (!course.course_id || !validCourseIds.has(course.course_id)) {
                console.warn(`❌ Invalid course ID: ${course.course_id}`);
                return false;
              }
              return true;
            });

            if (validCourses.length === 0) {
              return null;
            }

            return {
              ...term,
              courses: validCourses
            };
          })
          .filter((term:any) => term !== null);

        if (validTerms.length === 0) {
          return null;
        }

        return {
          name: plan.name,
          description: plan.description || `Career specialization track`,
          terms: validTerms
        };
      })
      .filter(plan => plan !== null);
  }

  private async savePlansToDatabase(userId: string, plans: GeneratedCareerPlan[]): Promise<CareerPlan[]> {
    const insertedPlans: CareerPlan[] = [];

    for (const plan of plans) {
      try {
        console.log(`💾 Saving plan: ${plan.name}`);

        // Create main plan using existing repository method
        const createdPlan = await this.repo.createCareerPlan({
          user_id: userId,
          name: plan.name,
          description: plan.description,
        });

        if (!createdPlan || !createdPlan.id) {
          console.error('❌ Failed to create career plan');
          continue;
        }

        // Create terms and courses using existing repository methods
        for (const term of plan.terms) {
          const termRecord = await this.repo.addCareerPlanTerm({
            career_plan_id: createdPlan.id,
            term_order: term.term_order,
            term_name: term.term_name,
          });

          if (!termRecord || !termRecord.id) {
            console.error('❌ Failed to create term');
            continue;
          }

          // Add courses per term
          for (const course of term.courses) {
            try {
              await this.repo.addCareerPlanCourse({
                career_plan_term_id: termRecord.id,
                course_id: course.course_id,
                reason: course.reason || 'Course recommended for this career track',
                required: true,
              });
            } catch (courseError) {
              console.error('❌ Error adding course:', courseError);
            }
          }
        }

        insertedPlans.push(createdPlan);
        console.log(`✅ Successfully saved plan: ${plan.name}`);

      } catch (planError) {
        console.error('❌ Error saving plan:', planError);
        continue;
      }
    }

    if (insertedPlans.length === 0) {
      throw new Error('Failed to save any career plans');
    }

    return insertedPlans;
  }
}