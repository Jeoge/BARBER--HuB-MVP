"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isMissingSnapReactionsTableError } from "@/lib/supabase/snaps";

export type SnapThanksState = {
  count: number;
  thanked: boolean;
  message?: string;
  error?: string;
};

type SnapForReaction = {
  id: string;
  author_id: string;
  is_deleted: boolean | null;
  is_published: boolean | null;
};

type SnapReactionRow = {
  snap_id: string;
  user_id: string;
  reaction_type: string;
};

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

async function countThanksForSnap(supabase: Awaited<ReturnType<typeof createClient>>, snapId: string, authorId: string) {
  try {
    const { data, error } = await supabase
      .from("snap_reactions")
      .select("snap_id, user_id, reaction_type")
      .eq("snap_id", snapId)
      .eq("reaction_type", "thanks")
      .returns<SnapReactionRow[]>();

    if (error) {
      if (isMissingSnapReactionsTableError(error)) {
        return 0;
      }

      console.error("Snap thanks count failed", {
        snapId,
        message: error.message,
      });
      return 0;
    }

    return (data ?? []).filter((reaction) => reaction.user_id !== authorId).length;
  } catch (error) {
    console.error("Snap thanks count threw", {
      snapId,
      message: errorMessage(error),
    });
    return 0;
  }
}

export async function toggleSnapThanksAction(previousState: SnapThanksState, formData: FormData): Promise<SnapThanksState> {
  const snapId = String(formData.get("snapId") ?? "").trim();
  const supabase = await createClient();

  if (!snapId) {
    return {
      ...previousState,
      error: "Snapが見つかりませんでした。",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Snap thanks auth lookup failed", {
        snapId,
        message: userError.message,
      });
    }

    return {
      ...previousState,
      error: "Thanksするにはログインしてください。",
    };
  }

  const { data: snap, error: snapError } = await supabase
    .from("snaps")
    .select("id, author_id, is_deleted, is_published")
    .eq("id", snapId)
    .maybeSingle<SnapForReaction>();

  if (snapError) {
    console.error("Snap thanks target lookup failed", {
      snapId,
      userId: user.id,
      message: snapError.message,
    });
    return {
      ...previousState,
      error: "Snapを確認できませんでした。少し時間をおいて再度お試しください。",
    };
  }

  if (snap == null || snap.is_deleted || snap.is_published === false) {
    return {
      ...previousState,
      error: "このSnapにはThanksできません。",
    };
  }

  if (snap.author_id === user.id) {
    return {
      count: await countThanksForSnap(supabase, snap.id, snap.author_id),
      thanked: false,
      message: "自分の投稿へのThanksはカウントされません。",
    };
  }

  const { data: existing, error: existingError } = await supabase
    .from("snap_reactions")
    .select("id")
    .eq("snap_id", snap.id)
    .eq("user_id", user.id)
    .eq("reaction_type", "thanks")
    .maybeSingle<{ id: string }>();

  if (existingError) {
    if (isMissingSnapReactionsTableError(existingError)) {
      return {
        ...previousState,
        error: "Thanks機能の準備中です。snap_reactionsテーブルのmigration適用状況を確認してください。",
      };
    }

    console.error("Snap thanks existing lookup failed", {
      snapId: snap.id,
      userId: user.id,
      message: existingError.message,
    });
    return {
      ...previousState,
      error: "Thanksを確認できませんでした。少し時間をおいて再度お試しください。",
    };
  }

  if (existing) {
    const { error: deleteError } = await supabase.from("snap_reactions").delete().eq("id", existing.id).eq("user_id", user.id);

    if (deleteError) {
      if (isMissingSnapReactionsTableError(deleteError)) {
        return {
          ...previousState,
          error: "Thanks機能の準備中です。snap_reactionsテーブルのmigration適用状況を確認してください。",
        };
      }

      console.error("Snap thanks delete failed", {
        snapId: snap.id,
        userId: user.id,
        message: deleteError.message,
      });
      return {
        ...previousState,
        error: "Thanksを取り消せませんでした。少し時間をおいて再度お試しください。",
      };
    }

    revalidatePath("/");
    revalidatePath("/snap");
    revalidatePath(`/posts/${snap.id}`);
    revalidatePath("/mypage");

    return {
      count: await countThanksForSnap(supabase, snap.id, snap.author_id),
      thanked: false,
      message: "Thanksを取り消しました。",
    };
  }

  const { error: insertError } = await supabase.from("snap_reactions").insert({
    snap_id: snap.id,
    user_id: user.id,
    reaction_type: "thanks",
  });

  if (insertError) {
    if (isMissingSnapReactionsTableError(insertError)) {
      return {
        ...previousState,
        error: "Thanks機能の準備中です。snap_reactionsテーブルのmigration適用状況を確認してください。",
      };
    }

    console.error("Snap thanks insert failed", {
      snapId: snap.id,
      userId: user.id,
      authorId: snap.author_id,
      message: insertError.message,
    });

    if (insertError.message.toLowerCase().includes("duplicate")) {
      return {
        count: await countThanksForSnap(supabase, snap.id, snap.author_id),
        thanked: true,
        message: "Thanks済みです。",
      };
    }

    return {
      ...previousState,
      error: "Thanksできませんでした。少し時間をおいて再度お試しください。",
    };
  }

  revalidatePath("/");
  revalidatePath("/snap");
  revalidatePath(`/posts/${snap.id}`);
  revalidatePath("/mypage");

  return {
    count: await countThanksForSnap(supabase, snap.id, snap.author_id),
    thanked: true,
    message: "Thanksしました。",
  };
}
