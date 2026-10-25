import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";

export type Exam = Database["public"]["Tables"]["exams"]["Row"];
export type InsertExam = Database["public"]["Tables"]["exams"]["Insert"];
export type UpdateExam = Database["public"]["Tables"]["exams"]["Update"];
export type Question = Database["public"]["Tables"]["questions"]["Row"];
export type UpdateQuestion = Database["public"]["Tables"]["questions"]["Update"];

export interface ExamWithQuestions extends Exam {
  questions: Question[];
}

export async function getUserExams(limit = 20, offset = 0) {
  const supabase = createClient();
  const { data, error, count } = await supabase
    .from("exams")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.warn("Lưu ý (Exams):", error.message);
    return { exams: [], totalCount: 0 };
  }
  return { exams: data || [], totalCount: count || 0 };
}

export async function getExamById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("exams")
    .select("*, questions(*)")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function createExam(examData: InsertExam) {
  const supabase = createClient();
  const { data, error } = await (supabase.from("exams") as any)
    .insert(examData)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as Exam;
}

export async function updateExam(id: string, updates: UpdateExam) {
  const supabase = createClient();
  const { data, error } = await (supabase.from("exams") as any)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as Exam;
}

export async function deleteExam(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) {
    throw error;
  }
  return true;
}

export async function updateQuestion(id: string, updates: UpdateQuestion) {
  const supabase = createClient();
  const { data, error } = await (supabase.from("questions") as any)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as Question;
}

export async function deleteQuestion(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) {
    throw error;
  }
  return true;
}
