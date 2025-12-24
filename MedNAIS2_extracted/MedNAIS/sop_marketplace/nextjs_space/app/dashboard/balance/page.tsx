import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { BalanceClient } from "./balance-client";

export const dynamic = "force-dynamic";

export default async function BalancePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/signin");
  }

  if (currentUser.role !== "seller") {
    redirect("/dashboard");
  }

  return <BalanceClient />;
}
