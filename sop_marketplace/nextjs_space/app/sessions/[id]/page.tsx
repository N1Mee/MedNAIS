
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { SessionDetailClient } from "./session-detail-client";

export const dynamic = "force-dynamic";

async function getSession(id: string) {
  const session = await prisma.sOPSession.findUnique({
    where: { id },
    include: {
      sop: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          steps: {
            orderBy: { order: "asc" },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      sessionSteps: {
        include: {
          step: true,
        },
        orderBy: {
          step: {
            order: "asc",
          },
        },
      },
    },
  });

  return session;
}

export default async function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [session, currentUser] = await Promise.all([
    getSession(params.id),
    getCurrentUser(),
  ]);

  if (!session) {
    notFound();
  }

  if (!currentUser || session.userId !== currentUser.id) {
    redirect("/auth/signin");
  }

  return <SessionDetailClient session={session} />;
}
