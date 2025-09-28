import { APIError } from '../../common/errors';
import { embedder } from '../../infrastructure/embeddings';
import { geminiModel } from '../../infrastructure/geimini';
import { supabase } from '../../infrastructure/supabase';
import { ChatRepository } from './chat.repository';
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SessionMemory {
  userId: string;
  messages: ChatMessage[];
  lastActivity: Date;
}

export class ChatService {
  private repo = new ChatRepository();
  
  // In-memory session storage (cleared when service restarts)
  private sessionMemory = new Map<string, SessionMemory>();
  
  // Clean up old sessions (optional - runs every hour)
  private cleanupInterval: NodeJS.Timeout;
  
  constructor() {
    // Clean up sessions older than 2 hours
    this.cleanupInterval = setInterval(() => {
      const now = new Date();
      for (const [userId, session] of this.sessionMemory.entries()) {
        const hoursSinceLastActivity = (now.getTime() - session.lastActivity.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastActivity > 2) {
          this.sessionMemory.delete(userId);
        }
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  // Get or create session memory for user
  private getSessionMemory(userId: string): SessionMemory {
    if (!this.sessionMemory.has(userId)) {
      this.sessionMemory.set(userId, {
        userId,
        messages: [],
        lastActivity: new Date()
      });
    }
    return this.sessionMemory.get(userId)!;
  }

  // Add message to session memory
  private addToMemory(userId: string, role: 'user' | 'assistant', content: string) {
    const session = this.getSessionMemory(userId);
    session.messages.push({
      role,
      content,
      timestamp: new Date()
    });
    session.lastActivity = new Date();
    
    // Keep only last 10 messages to prevent memory bloat
    if (session.messages.length > 10) {
      session.messages = session.messages.slice(-10);
    }
  }

  // Get conversation history for context
  private getConversationHistory(userId: string): string {
    const session = this.sessionMemory.get(userId);
    if (!session || session.messages.length === 0) {
      return '';
    }

      const history = session.messages
        .slice(-6) // Last 6 messages for context
        .map(msg => `${msg.role === 'user' ? 'Student' : 'Hokie'}: ${msg.content}`)
        .join('\n');

    return history ? `\nPrevious conversation context:\n${history}\n` : '';
  }

  /**
   * Chad: Semantic course recommendation engine with session memory
   * - Maintains conversation history per session
   * - Embeds user query for semantic search
   * - Finds closest courses by meaning
   * - Generates contextually aware responses using Gemini
   */
  async chatWithChad(userId: string, message: string) {
    if (!userId || !message?.trim()) {
      throw new APIError('userId and message are required');
    }

    // Add overall timeout for the entire operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI processing timeout after 25 seconds')), 25000);
    });

    try {
      const processingPromise = this.processChatRequest(userId, message);
      return await Promise.race([processingPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error in chatWithChad:', error);
      
      // Return a fallback response if AI processing fails
      return {
        chatMessage: "I'm having trouble processing your request right now. The AI services might be slow. Please try again in a moment, or try rephrasing your question.",
        recommendedCourses: [],
        conversationLength: this.getSessionMemory(userId).messages.length
      };
    }
  }

  private async processChatRequest(userId: string, message: string) {
    try {
      // Add user message to memory
      this.addToMemory(userId, 'user', message);

      console.log('🚀 Starting full AI processing...');
      
      // Try to get embeddings with timeout
      let embedding;
      let courses = [];
      
      try {
        console.log('🔍 Generating embeddings for semantic search...');
        const embeddingStartTime = Date.now();
        
        // Add timeout for embeddings
        const embeddingPromise = embedder.embedQuery(message);
        const embeddingTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Embedding timeout after 10 seconds')), 10000)
        );
        
        embedding = await Promise.race([embeddingPromise, embeddingTimeout]) as number[];
        const embeddingEndTime = Date.now();
        console.log(`✅ Embeddings generated in ${embeddingEndTime - embeddingStartTime}ms`);
        
      // Check if we should use fallback search first for subject-specific queries
      const lowerMessage = message.toLowerCase();
      const querySubject = this.extractSubjectFromMessage(lowerMessage);
      
      if (querySubject) {
        console.log(`🔍 Query has specific subject (${querySubject}), using fallback search directly...`);
        courses = await this.searchCoursesFallback(message);
      } else {
        // Try embedding search for general queries
        try {
          console.log('🔍 Searching for similar courses...');
          const searchStartTime = Date.now();
          
          const searchPromise = this.repo.searchCourses(embedding, 5);
          const searchTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Course search timeout after 5 seconds')), 5000)
          );
          
          courses = await Promise.race([searchPromise, searchTimeout]) as any[];
          const searchEndTime = Date.now();
          console.log(`✅ Course search completed in ${searchEndTime - searchStartTime}ms, found ${courses.length} courses`);
          
          // If no courses found, try fallback search
          if (courses.length === 0 || courses.length < 2) {
            console.log('🔍 No courses found, trying fallback search...');
            courses = await this.searchCoursesFallback(message);
          }
        } catch (searchError) {
          const errorMessage = searchError instanceof Error ? searchError.message : 'Unknown search error';
          console.warn('⚠️ Course search failed, trying fallback:', errorMessage);
          courses = await this.searchCoursesFallback(message);
        }
      }
        
      } catch (embeddingError) {
        const errorMessage = embeddingError instanceof Error ? embeddingError.message : 'Unknown embedding error';
        console.warn('⚠️ Embedding generation failed, using simple response:', errorMessage);
        // Continue without embeddings
      }

      // Try to get AI response with timeout
      let chatMessage;
      try {
        console.log('🤖 Generating AI response with Gemini...');
        
        // Build context for Gemini
        const conversationHistory = this.getConversationHistory(userId);
        const courseContext = courses.length > 0 
          ? courses.map((c, i) => `${i + 1}. ${c.code} — ${c.title} (Relevance: ${(c.similarity * 100).toFixed(1)}%)`).join('\n')
          : 'No specific courses found.';

        const enhancedPrompt = `You are Hokie — an expert academic advisor at Virginia Tech.

${conversationHistory}

Current student query: "${message}"

${courses.length > 0 ? `Recommended courses:\n${courseContext}` : ''}

Provide helpful, specific advice about courses and academic planning. Be conversational and helpful.`;

        // Add timeout for Gemini
        const geminiPromise = geminiModel.generate([[enhancedPrompt]]);
        const geminiTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gemini timeout after 15 seconds')), 15000)
        );
        
        const startTime = Date.now();
        const response = await Promise.race([geminiPromise, geminiTimeout]) as any;
        const endTime = Date.now();
        console.log(`✅ Gemini response generated in ${endTime - startTime}ms`);
        
        // Extract response text
        if (typeof response === 'string') {
          chatMessage = response;
        } else if (response?.generations?.[0]?.[0]?.text) {
          chatMessage = response.generations[0][0].text;
        } else if (response?.output?.text) {
          chatMessage = response.output.text;
        } else if (response?.content) {
          chatMessage = response.content;
        } else if (response?.text) {
          chatMessage = response.text;
        } else {
          throw new Error('Unexpected Gemini response format');
        }
        
      } catch (geminiError) {
        const errorMessage = geminiError instanceof Error ? geminiError.message : 'Unknown Gemini error';
        console.warn('⚠️ Gemini generation failed, using fallback response:', errorMessage);
        
        // Create intelligent fallback based on found courses and message content
        const lowerMessage = message.toLowerCase();
        
        if (courses.length > 0) {
          // Use the found courses to create a response
          const coursesList = courses
            .map(course => `• ${course.code} - ${course.title}`)
            .join('\n');
          
          const detectedSubject = this.extractSubjectFromMessage(lowerMessage);
          const subjectName = this.getSubjectName(detectedSubject || '');
          chatMessage = `I'd be happy to help you with ${subjectName} courses! Here are some relevant courses I found at Virginia Tech:

${coursesList}

What specific aspect of ${subjectName} are you interested in? Are you looking for introductory courses, specific topics, or career guidance?`;
        } else if (lowerMessage.includes('physics') || lowerMessage.includes('phys')) {
          chatMessage = `I'd be happy to help you with Physics courses! Here are some popular Physics courses at Virginia Tech:

• PHYS 2305 - Foundations of Physics I
• PHYS 2306 - Foundations of Physics II
• PHYS 2205 - General Physics I
• PHYS 2206 - General Physics II

What specific aspect of Physics are you interested in? Are you looking for introductory courses, specific topics, or career guidance?`;
        } else if (lowerMessage.includes('chemistry') || lowerMessage.includes('chem')) {
          chatMessage = `I'd be happy to help you with Chemistry courses! Here are some popular Chemistry courses at Virginia Tech:

• CHEM 1035 - General Chemistry I
• CHEM 1036 - General Chemistry II
• CHEM 1045 - General Chemistry Lab I
• CHEM 1046 - General Chemistry Lab II

What specific aspect of Chemistry are you interested in? Are you looking for introductory courses, specific topics, or career guidance?`;
        } else if (lowerMessage.includes('computer science') || lowerMessage.includes('cs')) {
          chatMessage = `I'd be happy to help you with Computer Science courses! Here are some popular CS courses at Virginia Tech:

• CS 1114 - Introduction to Software Design
• CS 2114 - Software Design and Data Structures  
• CS 2505 - Introduction to Computer Organization
• CS 3214 - Computer Systems

What specific aspect of Computer Science are you interested in? Are you looking for introductory courses, specific topics, or career guidance?`;
        } else if (lowerMessage.includes('engineering') || lowerMessage.includes('ece') || lowerMessage.includes('mechanical') || lowerMessage.includes('civil')) {
          chatMessage = `I'd be happy to help you with Engineering courses! Virginia Tech offers courses in various engineering disciplines:

• ECE - Electrical and Computer Engineering
• ME - Mechanical Engineering  
• CEE - Civil and Environmental Engineering
• AOE - Aerospace and Ocean Engineering
• ISE - Industrial and Systems Engineering

What specific engineering field are you interested in?`;
        } else if (lowerMessage.includes('course') || lowerMessage.includes('class')) {
          chatMessage = `I can help you find courses! You can search for courses by:
• Subject area (like Computer Science, Engineering, Physics, Chemistry, Math)
• Course level (introductory, advanced)
• Specific topics you're interested in

What subject or topic would you like to explore?`;
        } else {
          chatMessage = `Thanks for your message! I'm here to help with course recommendations, academic planning, and answering questions about Virginia Tech courses. 

What would you like to know about? You can ask about:
• Specific courses or subjects
• Academic planning
• Prerequisites
• Course difficulty or workload

How can I help you today?`;
        }
      }

      // Add assistant response to memory
      this.addToMemory(userId, 'assistant', chatMessage);

      return {
        chatMessage: chatMessage.trim(),
        recommendedCourses: courses,
        conversationLength: this.getSessionMemory(userId).messages.length
      };

    } catch (error) {
      console.error('Error in processChatRequest:', error);
      
      // Final fallback response
      const fallbackMessage = `I'm having some technical difficulties right now, but I'm still here to help! 

For course information, you can:
• Browse the course catalog
• Search for specific subjects
• Check course prerequisites

What specific courses or subjects are you interested in?`;
      
      this.addToMemory(userId, 'assistant', fallbackMessage);
      
      return {
        chatMessage: fallbackMessage,
        recommendedCourses: [],
        conversationLength: this.getSessionMemory(userId).messages.length
      };
    }
  }

  // Utility method to clear user's session memory
  clearUserSession(userId: string): void {
    this.sessionMemory.delete(userId);
  }

  // Utility method to get session info (for debugging)
  getSessionInfo(userId: string) {
    const session = this.sessionMemory.get(userId);
    return session ? {
      messageCount: session.messages.length,
      lastActivity: session.lastActivity,
      firstMessage: session.messages[0]?.timestamp
    } : null;
  }

  // Extract subject code from message
  private extractSubjectFromMessage(message: string): string | null {
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
    
    for (const [keyword, code] of Object.entries(subjectMap)) {
      if (message.includes(keyword)) {
        return code;
      }
    }
    return null;
  }

  // Get subject name from subject code
  private getSubjectName(subjectCode: string): string {
    const subjectNames = {
      'PHYS': 'Physics',
      'CHE': 'Chemistry',
      'CS': 'Computer Science',
      'ECE': 'Electrical and Computer Engineering',
      'ME': 'Mechanical Engineering',
      'CEE': 'Civil and Environmental Engineering',
      'AOE': 'Aerospace and Ocean Engineering',
      'AAD': 'Architecture',
      'BSE': 'Biological Systems Engineering',
      'MSE': 'Materials Science and Engineering',
      'MINE': 'Mining Engineering',
      'ISE': 'Industrial and Systems Engineering',
      'CEM': 'Chemical Engineering'
    };
    
    return subjectNames[subjectCode as keyof typeof subjectNames] || 'the requested subject';
  }

  // Fallback search when embeddings don't work well
  private async searchCoursesFallback(message: string): Promise<any[]> {
    try {
      console.log('🔍 Starting fallback search for:', message);
      const lowerMessage = message.toLowerCase();
      
      // Find matching subject using helper method
      const subjectCode = this.extractSubjectFromMessage(lowerMessage);
      console.log('🔍 Detected subject code:', subjectCode);
      
      if (subjectCode) {
        // Search by subject code
        console.log('🔍 Searching by subject code:', subjectCode);
        const { data, error } = await supabase
          .from('courses')
          .select('id, code, title, subject_code, description')
          .eq('subject_code', subjectCode)
          .limit(5);
          
        if (error) {
          console.error('❌ Supabase error:', error);
          throw error;
        }
        
        console.log('✅ Found courses by subject:', data?.length || 0);
        
        // Add similarity score for consistency with embedding results
        return (data || []).map(course => ({
          ...course,
          similarity: 0.8 // High similarity for subject matches
        }));
      } else {
        // Search by title/code if no subject match
        console.log('🔍 Searching by text match');
        const { data, error } = await supabase
          .from('courses')
          .select('id, code, title, subject_code, description')
          .or(`title.ilike.%${message}%,code.ilike.%${message}%`)
          .limit(5);
          
        if (error) {
          console.error('❌ Supabase error:', error);
          throw error;
        }
        
        console.log('✅ Found courses by text:', data?.length || 0);
        
        return (data || []).map(course => ({
          ...course,
          similarity: 0.6 // Medium similarity for text matches
        }));
      }
    } catch (error) {
      console.error('❌ Fallback search failed:', error);
      return [];
    }
  }

  // Cleanup method for graceful shutdown
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessionMemory.clear();
  }
}
