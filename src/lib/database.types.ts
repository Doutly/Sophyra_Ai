export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          experience_level: string | null
          industry: string | null
          career_goals: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          experience_level?: string | null
          industry?: string | null
          career_goals?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          experience_level?: string | null
          industry?: string | null
          career_goals?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          job_role: string
          experience_level: string
          industry: string | null
          company_name: string | null
          job_description: string
          resume_url: string | null
          voice_analysis_enabled: boolean
          body_language_enabled: boolean
          status: string
          total_questions: number
          current_question: number
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_role: string
          experience_level: string
          industry?: string | null
          company_name?: string | null
          job_description: string
          resume_url?: string | null
          voice_analysis_enabled?: boolean
          body_language_enabled?: boolean
          status?: string
          total_questions?: number
          current_question?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_role?: string
          experience_level?: string
          industry?: string | null
          company_name?: string | null
          job_description?: string
          resume_url?: string | null
          voice_analysis_enabled?: boolean
          body_language_enabled?: boolean
          status?: string
          total_questions?: number
          current_question?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      turns: {
        Row: {
          id: string
          session_id: string
          turn_number: number
          question: string
          answer: string | null
          transcription: string | null
          wpm: number | null
          filler_words: number | null
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          turn_number: number
          question: string
          answer?: string | null
          transcription?: string | null
          wpm?: number | null
          filler_words?: number | null
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          turn_number?: number
          question?: string
          answer?: string | null
          transcription?: string | null
          wpm?: number | null
          filler_words?: number | null
          duration_seconds?: number | null
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          session_id: string
          user_id: string
          overall_score: number
          clarity_score: number
          confidence_score: number
          relevance_score: number
          professionalism_score: number
          domain_fit_score: number | null
          eye_contact_ratio: number | null
          attention_stability: number | null
          avg_filler_words: number | null
          avg_speaking_pace: number | null
          strengths: Json
          gaps: Json
          suggested_topics: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          overall_score: number
          clarity_score: number
          confidence_score: number
          relevance_score: number
          professionalism_score: number
          domain_fit_score?: number | null
          eye_contact_ratio?: number | null
          attention_stability?: number | null
          avg_filler_words?: number | null
          avg_speaking_pace?: number | null
          strengths: Json
          gaps: Json
          suggested_topics: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          overall_score?: number
          clarity_score?: number
          confidence_score?: number
          relevance_score?: number
          professionalism_score?: number
          domain_fit_score?: number | null
          eye_contact_ratio?: number | null
          attention_stability?: number | null
          avg_filler_words?: number | null
          avg_speaking_pace?: number | null
          strengths?: Json
          gaps?: Json
          suggested_topics?: Json
          created_at?: string
        }
      }
      tips: {
        Row: {
          id: string
          user_id: string
          category: string
          content: string
          priority: number
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          content: string
          priority?: number
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          content?: string
          priority?: number
          is_read?: boolean
          created_at?: string
        }
      }
      shares: {
        Row: {
          id: string
          report_id: string
          user_id: string
          share_token: string
          expires_at: string | null
          view_count: number
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          user_id: string
          share_token: string
          expires_at?: string | null
          view_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          user_id?: string
          share_token?: string
          expires_at?: string | null
          view_count?: number
          created_at?: string
        }
      }
    }
  }
}
