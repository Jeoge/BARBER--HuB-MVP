import { LegalPageContent } from "@/components/LegalPageContent";
import { legalPages } from "@/lib/legalPages";

export default function GuidelinesPage() {
  return <LegalPageContent page={legalPages["community-guidelines"]} />;
}
