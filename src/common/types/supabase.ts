export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      career_plan_courses: {
        Row: {
          career_plan_term_id: string
          course_id: string
          id: string
          reason: string | null
          required: boolean | null
        }
        Insert: {
          career_plan_term_id: string
          course_id: string
          id?: string
          reason?: string | null
          required?: boolean | null
        }
        Update: {
          career_plan_term_id?: string
          course_id?: string
          id?: string
          reason?: string | null
          required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "career_plan_courses_career_plan_term_id_fkey"
            columns: ["career_plan_term_id"]
            isOneToOne: false
            referencedRelation: "career_plan_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_plan_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      career_plan_edges: {
        Row: {
          career_plan_term_id: string
          from_course_id: string
          id: string
          to_course_id: string
        }
        Insert: {
          career_plan_term_id: string
          from_course_id: string
          id?: string
          to_course_id: string
        }
        Update: {
          career_plan_term_id?: string
          from_course_id?: string
          id?: string
          to_course_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_plan_edges_career_plan_term_id_fkey"
            columns: ["career_plan_term_id"]
            isOneToOne: false
            referencedRelation: "career_plan_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_plan_edges_from_course_id_fkey"
            columns: ["from_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_plan_edges_to_course_id_fkey"
            columns: ["to_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      career_plan_terms: {
        Row: {
          career_plan_id: string
          id: string
          term_name: string
          term_order: number
        }
        Insert: {
          career_plan_id: string
          id?: string
          term_name: string
          term_order: number
        }
        Update: {
          career_plan_id?: string
          id?: string
          term_name?: string
          term_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "career_plan_terms_career_plan_id_fkey"
            columns: ["career_plan_id"]
            isOneToOne: false
            referencedRelation: "career_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      career_plans: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          selected: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          selected?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          selected?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      course_embeddings: {
        Row: {
          content: string | null
          course_id: string | null
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          source: string | null
        }
        Insert: {
          content?: string | null
          course_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_embeddings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          attendance_required: boolean | null
          course_id: string
          created_at: string | null
          difficulty: number | null
          grading_style: string | null
          id: string
          instructor: string | null
          interest: number | null
          rating: number | null
          review: string | null
          semester: string | null
          user_id: string
          workload: string | null
        }
        Insert: {
          attendance_required?: boolean | null
          course_id: string
          created_at?: string | null
          difficulty?: number | null
          grading_style?: string | null
          id?: string
          instructor?: string | null
          interest?: number | null
          rating?: number | null
          review?: string | null
          semester?: string | null
          user_id: string
          workload?: string | null
        }
        Update: {
          attendance_required?: boolean | null
          course_id?: string
          created_at?: string | null
          difficulty?: number | null
          grading_style?: string | null
          id?: string
          instructor?: string | null
          interest?: number | null
          rating?: number | null
          review?: string | null
          semester?: string | null
          user_id?: string
          workload?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tags: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          source: string | null
          tag: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          source?: string | null
          tag: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          source?: string | null
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_tags_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          contact_hours: Json | null
          corequisites: Json | null
          created_at: string | null
          credits: Json | null
          description: string | null
          id: string
          pathways: string | null
          prerequisites: Json | null
          restrictions: string | null
          subject_code: string
          title: string
        }
        Insert: {
          code: string
          contact_hours?: Json | null
          corequisites?: Json | null
          created_at?: string | null
          credits?: Json | null
          description?: string | null
          id?: string
          pathways?: string | null
          prerequisites?: Json | null
          restrictions?: string | null
          subject_code: string
          title: string
        }
        Update: {
          code?: string
          contact_hours?: Json | null
          corequisites?: Json | null
          created_at?: string | null
          credits?: Json | null
          description?: string | null
          id?: string
          pathways?: string | null
          prerequisites?: Json | null
          restrictions?: string | null
          subject_code?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_subject_code_fkey"
            columns: ["subject_code"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["code"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          name: string
        }
        Insert: {
          code: string
          name: string
        }
        Update: {
          code?: string
          name?: string
        }
        Relationships: []
      }
      user_term_courses: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          term: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          term: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          term?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_term_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_term_courses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string
          created_at: string | null
          degree: string
          graduation: string | null
          id: string
          interests: string[] | null
          major: string
          role: Database["public"]["Enums"]["user_role"]
          track: string | null
        }
        Insert: {
          auth_id: string
          created_at?: string | null
          degree: string
          graduation?: string | null
          id?: string
          interests?: string[] | null
          major: string
          role?: Database["public"]["Enums"]["user_role"]
          track?: string | null
        }
        Update: {
          auth_id?: string
          created_at?: string | null
          degree?: string
          graduation?: string | null
          id?: string
          interests?: string[] | null
          major?: string
          role?: Database["public"]["Enums"]["user_role"]
          track?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_courses: {
        Args: {
          exclude_course_id?: string
          filter?: Json
          match_count?: number
          min_similarity?: number
          probes?: number
          query_embedding: string
        }
        Returns: {
          code: string
          course_id: string
          similarity: number
          subject: string
          title: string
        }[]
      }
      match_courses_by_tags: {
        Args: { tags: string[] }
        Returns: {
          course_id: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      user_role: "user" | "admin" | "moderator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["user", "admin", "moderator"],
    },
  },
} as const
