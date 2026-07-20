import { requireBarberHubAdmin } from "@/lib/admin/permissions";
import { OfficialSourceScreen } from "../source-screen";

export const dynamic = "force-dynamic";

export default async function OfficialSourcePage() {
  await requireBarberHubAdmin();
  return <OfficialSourceScreen />;
}
