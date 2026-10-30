export interface QuestionPreview {
  id: string;
  order: number;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  content: string;
  options?: string[];
  sub_questions?: Array<{
    id: string;
    sub_label: string; // e.g., 'a', 'b', 'c', 'd'
    content: string;
  }>;
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard';
}

export interface QuestionFull extends QuestionPreview {
  correct_answer: string;
  explanation: string;
}

export interface ExamMatrix {
  total_questions: number;
  multiple_choice_count: number;
  true_false_count: number;
  short_answer_count: number;
  difficulty_distribution: {
    easy: number;       // Nhận biết
    medium: number;     // Thông hiểu
    hard: number;       // Vận dụng
    very_hard: number;  // Vận dụng cao
  };
  duration_minutes: number;
}

export interface MarketplaceItem {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_tier: 'free' | 'pro';
  title: string;
  subject: string;
  grade: number;
  description: string;
  price_credits: number;
  question_count: number;
  tags: string[];
  preview_data: {
    matrix: ExamMatrix;
    sample_questions: QuestionPreview[];
  };
  exam_data?: {
    questions: QuestionFull[];
  };
  downloads_count: number;
  rating: number;
  review_count: number;
  status: 'published' | 'draft' | 'archived';
  created_at: string;
  updated_at?: string;
  is_purchased?: boolean;
  is_owner?: boolean;
}

export interface MarketplacePurchase {
  id: string;
  buyer_id: string;
  item_id: string;
  price_credits: number;
  commission_rate: number;
  seller_earnings: number;
  platform_fee: number;
  created_at: string;
}

export interface PayoutRequest {
  id: string;
  user_id: string;
  amount_credits: number;
  amount_vnd: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
  completed_at?: string;
  note?: string;
}

export interface SellerDashboardStats {
  total_earned_credits: number;
  total_sales: number;
  active_listings: number;
  available_balance: number;
  commission_rate: number;
}

