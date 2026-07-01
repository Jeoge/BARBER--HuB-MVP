import { LegalPageContent } from "@/components/LegalPageContent";
import { legalPages } from "@/lib/legalPages";

export default function CommunityGuidelinesPage() {
  return <LegalPageContent page={legalPages["community-guidelines"]} />;
}
