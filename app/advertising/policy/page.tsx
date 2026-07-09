import { LegalPageContent } from "@/components/LegalPageContent";
import { legalPages } from "@/lib/legalPages";

export default function AdvertisingPolicyPage() {
  return <LegalPageContent page={legalPages["ad-policy"]} />;
}
