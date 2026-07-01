import { LegalPageContent } from "@/components/LegalPageContent";
import { legalPages } from "@/lib/legalPages";

export default function BackyardRulesPage() {
  return <LegalPageContent page={legalPages["backyard-rules"]} />;
}
