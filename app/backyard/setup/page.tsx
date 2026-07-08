import { redirect } from "next/navigation";
import { pathWithParams, safeNextPath } from "@/lib/auth/redirects";

type BackyardSetupRedirectPageProps = {
  searchParams?: Promise<{ next?: string }>;
};

export default async function BackyardSetupRedirectPage({ searchParams }: BackyardSetupRedirectPageProps) {
  const params = await searchParams;
  redirect(pathWithParams("/backroom/setup", { next: safeNextPath(params?.next, "/backroom") }));
}
