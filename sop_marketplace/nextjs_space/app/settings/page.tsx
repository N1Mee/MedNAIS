
import { requireAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getCurrentUserData(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
}

export default async function SettingsPage() {
  let user;
  try {
    user = await requireAuth();
  } catch (error) {
    redirect("/auth/signin?callbackUrl=/settings");
  }

  const userData = await getCurrentUserData(user.id);

  if (!userData) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      <SettingsClient user={userData} />
    </div>
  );
}
