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
          name: string
          profile_picture_url: string | null
          bio: string | null
          resume_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          profile_picture_url?: string | null
          bio?: string | null
          resume_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          profile_picture_url?: string | null
          bio?: string | null
          resume_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          role: string
          experience_level: string
          industry: string | null
          company: string | null
          jd_text: string
          resume_summary: string | null
          started_at: string | null
          ended_at: string | null
          overall_score: number | null
          total_duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          experience_level: string
          industry?: string | null
          company?: string | null
          jd_text: string
          resume_summary?: string | null
          started_at?: string | null
          ended_at?: string | null
          overall_score?: number | null
          total_duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          experience_level?: string
          industry?: string | null
          company?: string | null
          jd_text?: string
          resume_summary?: string | null
          started_at?: string | null
          ended_at?: string | null
          overall_score?: number | null
          total_duration_seconds?: number | null
          created_at?: string
        }
      }
      turns: {
        Row: {
          id: string
          session_id: string
          turn_number: number
          question: string
          tone_used: string | null
          answer_text: string | null
          answer_audio_url: string | null
          asr_confidence: number | null
          voice_metrics: Json | null
          body_metrics: Json | null
          eval_json: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          turn_number: number
          question: string
          tone_used?: string | null
          answer_text?: string | null
          answer_audio_url?: string | null
          asr_confidence?: number | null
          voice_metrics?: Json | null
          body_metrics?: Json | null
          eval_json?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          turn_number?: number
          question?: string
          tone_used?: string | null
          answer_text?: string | null
          answer_audio_url?: string | null
          asr_confidence?: number | null
          voice_metrics?: Json | null
          body_metrics?: Json | null
          eval_json?: Json | null
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          session_id: string
          overall_score: number
          performance_breakdown: Json
          strengths: Json
          gaps: Json
          suggested_topics: Json
          pdf_url: string | null
          share_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          overall_score: number
          performance_breakdown?: Json
          strengths?: Json
          gaps?: Json
          suggested_topics?: Json
          pdf_url?: string | null
          share_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          overall_score?: number
          performance_breakdown?: Json
          strengths?: Json
          gaps?: Json
          suggested_topics?: Json
          pdf_url?: string | null
          share_id?: string | null
          created_at?: string
        }
      }
      tips: {
        Row: {
          id: string
          user_id: string
          identified_weaknesses: Json | null
          suggested_topics: Json | null
          tier: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          identified_weaknesses?: Json | null
          suggested_topics?: Json | null
          tier?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          identified_weaknesses?: Json | null
          suggested_topics?: Json | null
          tier?: string | null
          updated_at?: string
        }
      }
      shares: {
        Row: {
          id: string
          report_id: string
          share_token: string
          public: boolean | null
          expires_at: string | null
          view_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          share_token: string
          public?: boolean | null
          expires_at?: string | null
          view_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          share_token?: string
          public?: boolean | null
          expires_at?: string | null
          view_count?: number | null
          created_at?: string
        }
      }
      mock_interview_requests: {
        Row: {
          id: string
          user_id: string
          job_role: string
          company_name: string | null
          experience_level: 'fresher' | 'mid' | 'senior'
          job_description: string
          preferred_date: string
          preferred_time: string
          additional_notes: string | null
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          admin_notes: string | null
          ticket_number: string | null
          priority: 'normal' | 'high' | 'urgent'
          scheduled_date: string | null
          scheduled_time: string | null
          assigned_admin_id: string | null
          status_updated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_role: string
          company_name?: string | null
          experience_level: 'fresher' | 'mid' | 'senior'
          job_description: string
          preferred_date: string
          preferred_time: string
          additional_notes?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          admin_notes?: string | null
          ticket_number?: string | null
          priority?: 'normal' | 'high' | 'urgent'
          scheduled_date?: string | null
          scheduled_time?: string | null
          assigned_admin_id?: string | null
          status_updated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_role?: string
          company_name?: string | null
          experience_level?: 'fresher' | 'mid' | 'senior'
          job_description?: string
          preferred_date?: string
          preferred_time?: string
          additional_notes?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          admin_notes?: string | null
          ticket_number?: string | null
          priority?: 'normal' | 'high' | 'urgent'
          scheduled_date?: string | null
          scheduled_time?: string | null
          assigned_admin_id?: string | null
          status_updated_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'request_created' | 'status_changed' | 'interview_scheduled' | 'reminder'
          title: string
          message: string
          read_status: boolean
          related_request_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'request_created' | 'status_changed' | 'interview_scheduled' | 'reminder'
          title: string
          message: string
          read_status?: boolean
          related_request_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'request_created' | 'status_changed' | 'interview_scheduled' | 'reminder'
          title?: string
          message?: string
          read_status?: boolean
          related_request_id?: string | null
          created_at?: string
        }
      }
      admin_actions: {
        Row: {
          id: string
          admin_id: string | null
          action_type: 'approved' | 'rejected' | 'scheduled' | 'completed' | 'noted'
          request_id: string
          notes: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          action_type: 'approved' | 'rejected' | 'scheduled' | 'completed' | 'noted'
          request_id: string
          notes?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          action_type?: 'approved' | 'rejected' | 'scheduled' | 'completed' | 'noted'
          request_id?: string
          notes?: string | null
          timestamp?: string
        }
      }
    }
  }
}
