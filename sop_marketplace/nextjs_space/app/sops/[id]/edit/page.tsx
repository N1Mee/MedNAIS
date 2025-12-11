
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { SOPEditor } from "../../_components/sop-editor";

export const dynamic = "force-dynamic";

async function getSOP(id: string, userId: string) {
  const sop = await prisma.sOP.findUnique({
    where: { id },
    include: {
      steps: {
        orderBy: { order: "asc" },
      },
      category: true,
    },
  });

  if (!sop) return null;

  // Check ownership
  if (sop.authorId !== userId) {
    redirect("/");
  }

  return sop;
}

export default async function EditSOPPage({
  params,
}: {
  params: { id: string };
}) {
  let user;
  try {
    user = await requireAuth();
  } catch (error) {
    redirect("/auth/signin?callbackUrl=/sops/" + params.id + "/edit");
  }

  const sop = await getSOP(params.id, user.id);

  if (!sop) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Edit SOP</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Update your standard operating procedure
        </p>
      </div>

      <SOPEditor sop={sop} />
    </div>
  );
}
