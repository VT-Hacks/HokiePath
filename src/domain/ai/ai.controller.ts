import { Request, Response, NextFunction } from 'express';
import { geminiModel } from '../../infrastructure/geimini';
import { CourseService } from '../courses/services/course.service';
import { CourseRepository } from '../courses/course.repository';

export class AIController {
  private courseService: CourseService;

  constructor() {
    const courseRepository = new CourseRepository();
    this.courseService = new CourseService(courseRepository);
  }

  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ 
          error: 'Message is required and must be a string' 
        });
      }

      // Create context-aware prompt for course advisor
      const systemPrompt = `You are an AI course advisor for Virginia Tech (VT). Your role is to help students with:
- Finding courses that match their interests and requirements
- Understanding course prerequisites and requirements
- Academic planning and scheduling advice
- Course difficulty and workload information
- General academic guidance for VT students

Keep responses helpful, concise, and focused on Virginia Tech courses and academic planning.
If asked about specific courses, try to provide relevant details about prerequisites, difficulty, and recommendations.

Student message: ${message}`;

      // Get AI response from Gemini
      const response = await geminiModel.invoke(systemPrompt);
      
      // Try to enhance response with course data if relevant
      let enhancedResponse = response.content;
      
      // Check if the message is asking about courses
      const courseKeywords = [
        'course', 'class', 'subject', 'courses', 'classes',
        'CS', 'ECE', 'MATH', 'ENGL', 'PHYS', 'CHEM', 'CHE', 'PHYSICS', 'CHEMISTRY',
        'AAD', 'AOE', 'BSE', 'CEE', 'CEM', 'ISE', 'ME', 'MINE', 'MSE',
        'computer science', 'engineering', 'physics', 'chemistry', 'business',
        'mechanical', 'electrical', 'civil', 'aerospace', 'architecture',
        'biology', 'mathematics', 'english', 'literature'
      ];
      const isAboutCourses = courseKeywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      );

      if (isAboutCourses) {
        try {
          // Extract subject from message for better search
          let searchTerm = message;
          let subjectFilter = null;
          
          // Map common subject names to subject codes
          const subjectMap = {
            'physics': 'PHYS',
            'chemistry': 'CHE',
            'computer science': 'CS',
            'cs': 'CS',
            'electrical': 'ECE',
            'ece': 'ECE',
            'mechanical': 'ME',
            'me': 'ME',
            'civil': 'CEE',
            'cee': 'CEE',
            'aerospace': 'AOE',
            'aoe': 'AOE',
            'architecture': 'AAD',
            'aad': 'AAD',
            'biology': 'BSE',
            'bse': 'BSE',
            'materials': 'MSE',
            'mse': 'MSE',
            'mining': 'MINE',
            'mine': 'MINE',
            'industrial': 'ISE',
            'ise': 'ISE',
            'chemical': 'CEM',
            'cem': 'CEM'
          };
          
          // Check if message contains subject keywords
          const lowerMessage = message.toLowerCase();
          for (const [keyword, code] of Object.entries(subjectMap)) {
            if (lowerMessage.includes(keyword)) {
              subjectFilter = code;
              break;
            }
          }
          
          // Try to find relevant courses
          const coursesResponse = await this.courseService.getCourses({
            tags: [], // Required field
            search: searchTerm,
            subject: subjectFilter || undefined,
            limit: 5
          });
          
          if (coursesResponse.courses && coursesResponse.courses.length > 0) {
            const coursesList = coursesResponse.courses
              .map(course => `- ${course.code}: ${course.title}`)
              .join('\n');
            
            enhancedResponse += `\n\nHere are some relevant courses I found:\n${coursesList}`;
          } else {
            // If no courses found, try a broader search
            const broaderSearch = await this.courseService.getCourses({
              tags: [],
              search: message.split(' ')[0], // Use first word as search term
              limit: 3
            });
            
            if (broaderSearch.courses && broaderSearch.courses.length > 0) {
              const coursesList = broaderSearch.courses
                .map(course => `- ${course.code}: ${course.title}`)
                .join('\n');
              
              enhancedResponse += `\n\nHere are some related courses I found:\n${coursesList}`;
            }
          }
        } catch (error) {
          console.error('Error fetching courses for AI response:', error);
          // Continue with just the AI response
        }
      }

      return res.status(200).json({
        message: enhancedResponse,
        timestamp: new Date().toISOString(),
        type: 'ai'
      });

    } catch (error) {
      console.error('AI Controller Error:', error);
      return res.status(500).json({
        error: 'Failed to generate AI response',
        message: 'I apologize, but I\'m having trouble processing your request right now. Please try again later.'
      });
    }
  };

  // Health check for AI service
  healthCheck = async (req: Request, res: Response) => {
    try {
      // Test AI service
      const testResponse = await geminiModel.invoke("Say 'AI service is working'");
      
      return res.status(200).json({
        status: 'healthy',
        ai_service: 'operational',
        timestamp: new Date().toISOString(),
        test_response: testResponse.content
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        ai_service: 'offline',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}


