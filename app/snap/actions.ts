"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isMissingSnapReactionsTableError } from "@/lib/supabase/snaps";

export type SnapReactionType = "thanks" | "like";

export type SnapReactionState = {
  count: number;
  active: boolean;
  message?: string;
  error?: string;
};

export type SnapThanksState = SnapReactionState;

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

const reactionTypes = new Set<SnapReactionType>(["thanks", "like"]);

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

function reactionLabel(reactionType: SnapReactionType) {
  return reactionType === "thanks" ? "Thanks" : "いいね";
}

async function countReactionsForSnap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  snapId: string,
  authorId: string,
  viewerId: string,
  reactionType: SnapReactionType
) {
  try {
    const { data, error } = await supabase
      .from("snap_reactions")
      .select("snap_id, user_id, reaction_type")
      .eq("snap_id", snapId)
      .eq("user_id", viewerId)
      .eq("reaction_type", reactionType)
      .returns<SnapReactionRow[]>();

    if (error) {
      if (isMissingSnapReactionsTableError(error)) {
        return 0;
      }

      console.error("Snap reaction count failed", {
        snapId,
        reactionType,
        message: error.message,
      });
      return 0;
    }

    return (data ?? []).filter((reaction) => reaction.user_id !== authorId).length;
  } catch (error) {
    console.error("Snap reaction count threw", {
      snapId,
      reactionType,
      message: errorMessage(error),
    });
    return 0;
  }
}

export async function toggleSnapReactionAction(previousState: SnapReactionState, formData: FormData): Promise<SnapReactionState> {
  const snapId = String(formData.get("snapId") ?? "").trim();
  const reactionType = String(formData.get("reactionType") ?? "thanks").trim() as SnapReactionType;
  const supabase = await createClient();
  const label = reactionTypes.has(reactionType) ? reactionLabel(reactionType) : "リアクション";

  if (!snapId || !reactionTypes.has(reactionType)) {
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
      console.error("Snap reaction auth lookup failed", {
        snapId,
        reactionType,
        message: userError.message,
      });
    }

    return {
      ...previousState,
      error: `${label}するにはログインしてください。`,
    };
  }

  const { data: snap, error: snapError } = await supabase
    .from("snaps")
    .select("id, author_id, is_deleted, is_published")
    .eq("id", snapId)
    .maybeSingle<SnapForReaction>();

  if (snapError) {
    console.error("Snap reaction target lookup failed", {
      snapId,
      userId: user.id,
      reactionType,
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
      error: `このSnapには${label}できません。`,
    };
  }

  if (snap.author_id === user.id) {
    return {
      count: await countReactionsForSnap(supabase, snap.id, snap.author_id, user.id, reactionType),
      active: false,
      message: "自分の投稿にはリアクションできません。",
    };
  }

  const { data: existing, error: existingError } = await supabase
    .from("snap_reactions")
    .select("id")
    .eq("snap_id", snap.id)
    .eq("user_id", user.id)
    .eq("reaction_type", reactionType)
    .maybeSingle<{ id: string }>();

  if (existingError) {
    if (isMissingSnapReactionsTableError(existingError)) {
      return {
        ...previousState,
        error: "リアクション機能の準備中です。しばらく時間をおいて再度お試しください。",
      };
    }

    console.error("Snap reaction existing lookup failed", {
      snapId: snap.id,
      userId: user.id,
      reactionType,
      message: existingError.message,
    });
    return {
      ...previousState,
      error: "リアクションを確認できませんでした。少し時間をおいて再度お試しください。",
    };
  }

  if (existing) {
    const { error: deleteError } = await supabase.from("snap_reactions").delete().eq("id", existing.id).eq("user_id", user.id);

    if (deleteError) {
      if (isMissingSnapReactionsTableError(deleteError)) {
        return {
          ...previousState,
          error: "リアクション機能の準備中です。しばらく時間をおいて再度お試しください。",
        };
      }

      console.error("Snap reaction delete failed", {
        snapId: snap.id,
        userId: user.id,
        reactionType,
        message: deleteError.message,
      });
      return {
        ...previousState,
        error: "リアクションを取り消せませんでした。少し時間をおいて再度お試しください。",
      };
    }

    revalidatePath("/");
    revalidatePath("/snap");
    revalidatePath(`/posts/${snap.id}`);
    revalidatePath("/mypage");

    return {
      count: await countReactionsForSnap(supabase, snap.id, snap.author_id, user.id, reactionType),
      active: false,
      message: `${label}を取り消しました。`,
    };
  }

  const { error: insertError } = await supabase.from("snap_reactions").insert({
    snap_id: snap.id,
    user_id: user.id,
    reaction_type: reactionType,
  });

  if (insertError) {
    if (isMissingSnapReactionsTableError(insertError)) {
      return {
        ...previousState,
        error: "リアクション機能の準備中です。しばらく時間をおいて再度お試しください。",
      };
    }

    console.error("Snap reaction insert failed", {
      snapId: snap.id,
      userId: user.id,
      authorId: snap.author_id,
      reactionType,
      message: insertError.message,
    });

    if (insertError.message.toLowerCase().includes("duplicate")) {
      return {
        count: await countReactionsForSnap(supabase, snap.id, snap.author_id, user.id, reactionType),
        active: true,
        message: `${label}済みです。`,
      };
    }

    return {
      ...previousState,
      error: "リアクションできませんでした。少し時間をおいて再度お試しください。",
    };
  }

  revalidatePath("/");
  revalidatePath("/snap");
  revalidatePath(`/posts/${snap.id}`);
  revalidatePath("/mypage");

  return {
    count: await countReactionsForSnap(supabase, snap.id, snap.author_id, user.id, reactionType),
    active: true,
    message: `${label}しました。`,
  };
}

export async function toggleSnapThanksAction(previousState: SnapThanksState, formData: FormData): Promise<SnapThanksState> {
  formData.set("reactionType", "thanks");
  return toggleSnapReactionAction(previousState, formData);
}
