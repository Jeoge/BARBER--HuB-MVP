import type { SupabaseClient } from "@supabase/supabase-js";

export const QA_CATEGORIES = [
  "技術",
  "経営",
  "集客",
  "求人",
  "材料",
  "独立",
  "税務",
  "組合",
  "学校",
  "STU",
  "アシスタント",
  "その他",
] as const;

export type QaCategory = (typeof QA_CATEGORIES)[number];

export type QaAuthorProfile = {
  id: string;
  display_name: string | null;
  job_type: string | null;
  salon_name: string | null;
  region: string | null;
  avatar_url: string | null;
};

export type QaQuestionRecord = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: QaCategory;
  created_at: string | null;
  updated_at: string | null;
  is_deleted: boolean | null;
  is_resolved: boolean | null;
};

export type QaQuestionWithAuthor = QaQuestionRecord & {
  profiles: QaAuthorProfile | null;
  answer_count: number;
};

export type QaAnswer = {
  id: string;
  question_id: string;
  user_id: string;
  body: string;
  created_at: string | null;
  updated_at: string | null;
  is_best_answer: boolean | null;
  profiles: QaAuthorProfile | null;
};

export type QaAnswerWithQuestion = QaAnswer & {
  qa_questions: {
    id: string;
    title: string;
    category: QaCategory;
  } | null;
};

type RawQaQuestion = QaQuestionRecord & {
  profiles: QaAuthorProfile | QaAuthorProfile[] | null;
};

type RawQaAnswer = Omit<QaAnswer, "profiles"> & {
  profiles: QaAuthorProfile | QaAuthorProfile[] | null;
};

type RawQaAnswerWithQuestion = Omit<QaAnswerWithQuestion, "profiles" | "qa_questions"> & {
  profiles: QaAuthorProfile | QaAuthorProfile[] | null;
  qa_questions: QaAnswerWithQuestion["qa_questions"] | QaAnswerWithQuestion["qa_questions"][] | null;
};

type QaAnswerCountRow = {
  question_id: string;
};

const qaQuestionSelect = `
  id,
  user_id,
  title,
  body,
  category,
  created_at,
  updated_at,
  is_deleted,
  is_resolved,
  profiles:user_id (
    id,
    display_name,
    job_type,
    salon_name,
    region,
    avatar_url
  )
`;

const qaQuestionBaseSelect = `
  id,
  user_id,
  title,
  body,
  category,
  created_at,
  updated_at,
  is_deleted,
  is_resolved
`;

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

function normalizeProfile(profile: QaAuthorProfile | QaAuthorProfile[] | null) {
  return Array.isArray(profile) ? profile[0] ?? null : profile;
}

function normalizeQuestion(data: unknown): QaQuestionWithAuthor | null {
  const question = data as RawQaQuestion | null;
  if (question == null) return null;

  return {
    ...question,
    profiles: normalizeProfile(question.profiles),
    answer_count: 0,
  };
}

function normalizeQuestions(data: unknown): QaQuestionWithAuthor[] {
  return ((data ?? []) as RawQaQuestion[]).map((question) => ({
    ...question,
    profiles: normalizeProfile(question.profiles),
    answer_count: 0,
  }));
}

function normalizeAnswers(data: unknown): QaAnswer[] {
  return ((data ?? []) as RawQaAnswer[]).map((answer) => ({
    ...answer,
    profiles: normalizeProfile(answer.profiles),
  }));
}

function normalizeQuestionLink(value: QaAnswerWithQuestion["qa_questions"] | QaAnswerWithQuestion["qa_questions"][] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeAnswersWithQuestions(data: unknown): QaAnswerWithQuestion[] {
  return ((data ?? []) as RawQaAnswerWithQuestion[]).map((answer) => ({
    ...answer,
    profiles: normalizeProfile(answer.profiles),
    qa_questions: normalizeQuestionLink(answer.qa_questions),
  }));
}

async function withAnswerCounts(supabase: SupabaseClient, questions: QaQuestionWithAuthor[]) {
  const questionIds = questions.map((question) => question.id);
  if (questionIds.length === 0) return questions;

  try {
    const { data, error } = await supabase
      .from("qa_answers")
      .select("question_id")
      .in("question_id", questionIds)
      .eq("is_deleted", false)
      .returns<QaAnswerCountRow[]>();

    if (error) {
      console.error("Q&A answer count select failed", {
        message: error.message,
      });
      return questions;
    }

    const countByQuestionId = new Map<string, number>();
    (data ?? []).forEach((answer) => {
      countByQuestionId.set(answer.question_id, (countByQuestionId.get(answer.question_id) ?? 0) + 1);
    });

    return questions.map((question) => ({
      ...question,
      answer_count: countByQuestionId.get(question.id) ?? 0,
    }));
  } catch (error) {
    console.error("Q&A answer count select threw", {
      message: errorMessage(error),
    });
    return questions;
  }
}

export function isQaCategory(value: string): value is QaCategory {
  return QA_CATEGORIES.includes(value as QaCategory);
}

export function qaAuthorName(item: QaQuestionWithAuthor | QaAnswer) {
  return item.profiles?.display_name?.trim() || item.profiles?.salon_name?.trim() || "プロフィール未設定";
}

export function qaAuthorMeta(item: QaQuestionWithAuthor | QaAnswer) {
  return [item.profiles?.job_type, item.profiles?.salon_name, item.profiles?.region]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .join(" / ");
}

export function qaDateLabel(item: Pick<QaQuestionRecord, "created_at">) {
  if (!item.created_at) return "投稿日時未設定";

  const createdAt = new Date(item.created_at);
  if (Number.isNaN(createdAt.getTime())) return "投稿日時未設定";

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(createdAt);
}

export function qaExcerpt(body: string, maxLength = 84) {
  const singleLine = body.replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxLength) return singleLine;
  return `${singleLine.slice(0, maxLength)}...`;
}

export async function listQaQuestions(supabase: SupabaseClient, limit = 30) {
  try {
    const { data, error } = await supabase
      .from("qa_questions")
      .select(qaQuestionSelect)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Q&A questions joined select failed", {
        message: error.message,
      });

      const fallback = await supabase
        .from("qa_questions")
        .select(qaQuestionBaseSelect)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!fallback.error) {
        return { questions: await withAnswerCounts(supabase, normalizeQuestions(fallback.data)), error: null };
      }

      console.error("Q&A questions fallback select failed", {
        message: fallback.error.message,
      });
    }

    return { questions: await withAnswerCounts(supabase, normalizeQuestions(data)), error };
  } catch (error) {
    console.error("Q&A questions select threw", {
      message: errorMessage(error),
    });
    return { questions: [], error };
  }
}

export async function listUserQaQuestions(supabase: SupabaseClient, userId: string, limit = 20) {
  try {
    const { data, error } = await supabase
      .from("qa_questions")
      .select(qaQuestionSelect)
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("User Q&A questions joined select failed", {
        userId,
        message: error.message,
      });
    }

    return { questions: await withAnswerCounts(supabase, normalizeQuestions(data)), error };
  } catch (error) {
    console.error("User Q&A questions select threw", {
      userId,
      message: errorMessage(error),
    });
    return { questions: [], error };
  }
}

export async function getQaQuestionById(supabase: SupabaseClient, id: string) {
  try {
    const { data, error } = await supabase
      .from("qa_questions")
      .select(qaQuestionSelect)
      .eq("id", id)
      .eq("is_deleted", false)
      .maybeSingle();

    if (error) {
      console.error("Q&A detail joined select failed", {
        questionId: id,
        message: error.message,
      });
    }

    const question = normalizeQuestion(data);
    const withCounts = question ? await withAnswerCounts(supabase, [question]) : [];

    return { question: withCounts[0] ?? null, error };
  } catch (error) {
    console.error("Q&A detail select threw", {
      questionId: id,
      message: errorMessage(error),
    });
    return { question: null, error };
  }
}

export async function listQaAnswers(supabase: SupabaseClient, questionId: string, limit = 80) {
  try {
    const { data, error } = await supabase
      .from("qa_answers")
      .select(
        `
        id,
        question_id,
        user_id,
        body,
        created_at,
        updated_at,
        is_best_answer,
        profiles:user_id (
          id,
          display_name,
          job_type,
          salon_name,
          region,
          avatar_url
        )
      `
      )
      .eq("question_id", questionId)
      .eq("is_deleted", false)
      .order("is_best_answer", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Q&A answers joined select failed", {
        questionId,
        message: error.message,
      });
    }

    return { answers: normalizeAnswers(data), error };
  } catch (error) {
    console.error("Q&A answers select threw", {
      questionId,
      message: errorMessage(error),
    });
    return { answers: [], error };
  }
}

export async function listUserQaAnswers(supabase: SupabaseClient, userId: string, limit = 20) {
  try {
    const { data, error } = await supabase
      .from("qa_answers")
      .select(
        `
        id,
        question_id,
        user_id,
        body,
        created_at,
        updated_at,
        is_best_answer,
        profiles:user_id (
          id,
          display_name,
          job_type,
          salon_name,
          region,
          avatar_url
        ),
        qa_questions:question_id (
          id,
          title,
          category
        )
      `
      )
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("User Q&A answers joined select failed", {
        userId,
        message: error.message,
      });
    }

    return { answers: normalizeAnswersWithQuestions(data), error };
  } catch (error) {
    console.error("User Q&A answers select threw", {
      userId,
      message: errorMessage(error),
    });
    return { answers: [], error };
  }
}
