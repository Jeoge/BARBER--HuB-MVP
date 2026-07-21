import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PARTNERS問い合わせ管理 | BARBER HUB",
  robots: { index: false, follow: false },
};

export default function PartnerInquiriesAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
