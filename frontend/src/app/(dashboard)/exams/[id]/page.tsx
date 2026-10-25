"use client";

import { use } from "react";
import { ExamEditorStudio } from "@/components/exam-studio/exam-editor-studio";

export default function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return <ExamEditorStudio initialExamId={resolvedParams.id} />;
}
