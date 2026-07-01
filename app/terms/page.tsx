import { LegalPageContent } from "@/components/LegalPageContent";
import { legalPages } from "@/lib/legalPages";

export default function TermsPage() {
  return <LegalPageContent page={legalPages.terms} />;
}
