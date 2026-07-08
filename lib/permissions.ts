import { pathWithParams } from "@/lib/auth/redirects";
import {
  canCreateArticle,
  canCreateBackroom,
  canCreateJob,
  canCreateQa,
  canCreateReport,
  canCreateSnap,
  canCreateSuccession,
  classifyAccountType,
  type AccountProfileLike,
} from "@/lib/accountTypes";

export type PostCapability =
  | "snap"
  | "article"
  | "report"
  | "qa"
  | "backroom"
  | "job"
  | "succession";

export type PostPermissionResult =
  | { allowed: true }
  | {
      allowed: false;
      destination: "profile" | "advertising";
      message: string;
    };

export const ACCOUNT_TYPE_REQUIRED_MESSAGE =
  "投稿するには登録区分の設定が必要です。プロフィール編集で登録区分を選択してください。";

export const ACCOUNT_TYPE_UNKNOWN_MESSAGE =
  "この登録区分では投稿権限を確認できませんでした。プロフィール編集で登録区分を選び直してください。";

export const ORGANIZATION_POST_RESTRICTED_MESSAGE =
  "企業・団体アカウントでは通常投稿はできません。商品紹介、学校案内、講習会告知、組合案内、求人支援、協賛掲載をご希望の場合は、広告掲載・協賛の問い合わせをご利用ください。";

const salonOwnerRequiredMessages: Record<Extract<PostCapability, "job" | "succession">, string> = {
  job: "求人掲載はサロンオーナーまたはサロン登録のアカウントで利用できます。プロフィール編集で登録区分と店舗情報を確認してください。",
  succession: "開業・承継情報の掲載はサロンオーナーまたはサロン登録のアカウントで利用できます。プロフィール編集で登録区分を確認してください。",
};

function capabilityAllowed(profile: AccountProfileLike | null | undefined, capability: PostCapability) {
  if (capability === "snap") return canCreateSnap(profile);
  if (capability === "article") return canCreateArticle(profile);
  if (capability === "report") return canCreateReport(profile);
  if (capability === "qa") return canCreateQa(profile);
  if (capability === "backroom") return canCreateBackroom(profile);
  if (capability === "job") return canCreateJob(profile);
  return canCreateSuccession(profile);
}

export function getPostPermission(profile: AccountProfileLike | null | undefined, capability: PostCapability): PostPermissionResult {
  if (capabilityAllowed(profile, capability)) return { allowed: true };

  const classification = classifyAccountType(profile);

  if (classification === "unset") {
    return {
      allowed: false,
      destination: "profile",
      message: ACCOUNT_TYPE_REQUIRED_MESSAGE,
    };
  }

  if (classification === "unknown") {
    return {
      allowed: false,
      destination: "profile",
      message: ACCOUNT_TYPE_UNKNOWN_MESSAGE,
    };
  }

  if (classification === "organization") {
    return {
      allowed: false,
      destination: "advertising",
      message: ORGANIZATION_POST_RESTRICTED_MESSAGE,
    };
  }

  if (capability === "job" || capability === "succession") {
    return {
      allowed: false,
      destination: "profile",
      message: salonOwnerRequiredMessages[capability],
    };
  }

  return {
    allowed: false,
    destination: "profile",
    message: ACCOUNT_TYPE_UNKNOWN_MESSAGE,
  };
}

export function getPostPermissionRedirect(profile: AccountProfileLike | null | undefined, capability: PostCapability, nextPath: string) {
  const permission = getPostPermission(profile, capability);
  if (permission.allowed) return null;

  if (permission.destination === "advertising") {
    return pathWithParams("/advertising", {
      message: permission.message,
      next: nextPath,
    });
  }

  return pathWithParams("/mypage/profile/edit", {
    error: permission.message,
    next: nextPath,
  });
}
