import { Suspense, type ReactNode } from "react";
import AppSidebarLayout from "@/components/incubateur/AppSidebarLayout";

export default function IncubateurLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2]" />}>
      <AppSidebarLayout>{children}</AppSidebarLayout>
    </Suspense>
  );
}
