import { supabase } from '../../infrastructure/supabase';

export class ChatRepository {
  async searchCourses(queryEmbedding: number[], limit = 5) {
    const { data, error } = await supabase.rpc('match_courses', {
      query_embedding: queryEmbedding as any,
      match_count: limit,
    });

    if (error) throw error;
    return data || [];
  }
}

