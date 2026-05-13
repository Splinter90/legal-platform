"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SkeletonAuthCheck } from "@/components/ui/skeleton";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "client") {
      router.push("/login");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <SkeletonAuthCheck />;
  }

  if ((session?.user as any)?.role !== "client") return null;

  return (
    <DashboardLayout role="client" userName={session?.user?.name || ""}>
      {children}
    </DashboardLayout>
  );
}
