"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SkeletonAuthCheck } from "@/components/ui/skeleton";

export default function LawyerLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "lawyer") {
      router.push("/login");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <SkeletonAuthCheck />;
  }

  if ((session?.user as any)?.role !== "lawyer") return null;

  return (
    <DashboardLayout
      role="lawyer"
      userName={session?.user?.name || ""}
      userImage={session?.user?.image || null}
    >
      {children}
    </DashboardLayout>
  );
}
