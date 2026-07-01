import { LegalPageContent } from "@/components/LegalPageContent";
import { legalPages } from "@/lib/legalPages";

export default function AdPolicyPage() {
  return <LegalPageContent page={legalPages["ad-policy"]} />;
}
