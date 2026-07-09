import { LegalPageContent } from "@/components/LegalPageContent";
import { legalPages } from "@/lib/legalPages";

export default function BackroomRulesPage() {
  return <LegalPageContent page={legalPages["backyard-rules"]} />;
}
