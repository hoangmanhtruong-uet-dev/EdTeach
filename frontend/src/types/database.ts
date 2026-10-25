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
          name: string | null
          role: 'teacher' | 'student' | 'admin'
          school: string | null
          avatar_url: string | null
          referral_code: string | null
          referred_by: string | null
          tier: 'free' | 'pro' | 'school'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: 'teacher' | 'student' | 'admin'
          school?: string | null
          avatar_url?: string | null
          referral_code?: string | null
          referred_by?: string | null
          tier?: 'free' | 'pro' | 'school'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'teacher' | 'student' | 'admin'
          school?: string | null
          avatar_url?: string | null
          referral_code?: string | null
          referred_by?: string | null
          tier?: 'free' | 'pro' | 'school'
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          daily_quota: number
          daily_quota_used: number
          last_quota_reset: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          daily_quota?: number
          daily_quota_used?: number
          last_quota_reset?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          daily_quota?: number
          daily_quota_used?: number
          last_quota_reset?: string
          created_at?: string
          updated_at?: string
        }
      }
      wallet_txns: {
        Row: {
          id: string
          wallet_id: string
          amount: number
          type: 'signup_bonus' | 'generate_exam' | 'export' | 'purchase' | 'refund'
          description: string | null
          ref_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          amount: number
          type: 'signup_bonus' | 'generate_exam' | 'export' | 'purchase' | 'refund'
          description?: string | null
          ref_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          amount?: number
          type?: 'signup_bonus' | 'generate_exam' | 'export' | 'purchase' | 'refund'
          description?: string | null
          ref_id?: string | null
          created_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          user_id: string
          name: string
          subject: string
          grade: string
          chapter: string | null
          config: Json
          status: 'draft' | 'generating' | 'completed' | 'failed'
          credit_cost: number
          question_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          subject: string
          grade: string
          chapter?: string | null
          config?: Json
          status?: 'draft' | 'generating' | 'completed' | 'failed'
          credit_cost?: number
          question_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          subject?: string
          grade?: string
          chapter?: string | null
          config?: Json
          status?: 'draft' | 'generating' | 'completed' | 'failed'
          credit_cost?: number
          question_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          exam_id: string
          type: 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank'
          content: string
          options: Json | null
          correct_answer: string | null
          explanation: string | null
          difficulty: 'easy' | 'medium' | 'hard' | 'very_hard'
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          type: 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank'
          content: string
          options?: Json | null
          correct_answer?: string | null
          explanation?: string | null
          difficulty?: 'easy' | 'medium' | 'hard' | 'very_hard'
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          type?: 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank'
          content?: string
          options?: Json | null
          correct_answer?: string | null
          explanation?: string | null
          difficulty?: 'easy' | 'medium' | 'hard' | 'very_hard'
          order_index?: number
          created_at?: string
        }
      }
      payment_orders: {
        Row: {
          id: string
          user_id: string
          order_code: string
          amount: number
          credits: number
          status: 'pending' | 'paid' | 'cancelled' | 'expired'
          sepay_txn_id: string | null
          created_at: string
          paid_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          order_code: string
          amount: number
          credits: number
          status?: 'pending' | 'paid' | 'cancelled' | 'expired'
          sepay_txn_id?: string | null
          created_at?: string
          paid_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          order_code?: string
          amount?: number
          credits?: number
          status?: 'pending' | 'paid' | 'cancelled' | 'expired'
          sepay_txn_id?: string | null
          created_at?: string
          paid_at?: string | null
        }
      }
    }
  }
}