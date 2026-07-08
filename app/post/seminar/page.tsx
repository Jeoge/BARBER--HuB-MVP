import { redirect } from "next/navigation";

export default function SeminarPostPage() {
  redirect("/post/article?category=seminar_report");
}
