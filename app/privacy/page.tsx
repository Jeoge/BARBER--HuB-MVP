import { LegalPageContent } from "@/components/LegalPageContent";
import { legalPages } from "@/lib/legalPages";

export default function PrivacyPage() {
  return <LegalPageContent page={legalPages.privacy} />;
}
