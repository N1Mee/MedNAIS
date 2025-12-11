
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import RunSOPClient from "./run-client";

export const dynamic = "force-dynamic";

export default async function RunSOPPage({
  params,
}: {
  params: { id: string };
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/signin");
  }

  return <RunSOPClient sopId={params.id} />;
}
