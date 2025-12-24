
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { SOPCard } from "@/components/sop-card";
import { EmptyState } from "@/components/empty-state";
import { User, Calendar, FileText, Mail, LogOut } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { AuthorStats } from "./author-stats";
import { SignOutButton } from "./sign-out-button";

export const dynamic = "force-dynamic";

async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
}

async function getUserSOPs(id: string, isOwner: boolean) {
  return await prisma.sOP.findMany({
    where: {
      authorId: id,
      ...(isOwner ? {} : { visibility: "public" }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      category: true,
      _count: {
        select: { steps: true },
      },
    },
  });
}

export default async function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const [user, currentUser] = await Promise.all([
    getUser(params.id),
    getCurrentUser(),
  ]);

  if (!user) {
    notFound();
  }

  const isOwner = currentUser?.id === user.id;
  const sops = await getUserSOPs(params.id, isOwner);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-[#E63946]/10 flex items-center justify-center flex-shrink-0">
              <User className="h-12 w-12 text-[#E63946]" />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  {user.name || "Anonymous"}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === "seller"
                      ? "bg-[#E63946]/10 text-[#E63946]"
                      : "bg-blue-100 dark:bg-blue-900/20 text-blue-600"
                  }`}
                >
                  {user.role === "seller" ? "Seller" : "Buyer"}
                </span>
              </div>

              {user.bio && (
                <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-2xl">
                  {user.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>
                    {sops.length} {user.role === "seller" ? "SOP" : "Favorite"}
                    {sops.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-col md:flex-row">
            {isOwner ? (
              <>
                <Link
                  href="/settings"
                  className="px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition"
                >
                  Edit Profile
                </Link>
                <SignOutButton />
              </>
            ) : (
              <a
                href={`mailto:${user.email}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <Mail className="h-4 w-4" />
                Contact
              </a>
            )}
          </div>
        </div>

        {/* Author Statistics */}
        {user.role === "seller" && <AuthorStats userId={user.id} />}
      </div>

      {/* User's SOPs */}
      <div>
        <h2 className="text-2xl font-bold mb-6">
          {isOwner
            ? "Your SOPs"
            : `${user.name || "User"}'s ${user.role === "seller" ? "SOPs" : "Favorites"}`}
        </h2>

        {sops.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={isOwner ? "No SOPs Yet" : "No Public SOPs"}
            description={
              isOwner
                ? "Create your first SOP to share your expertise."
                : "This user hasn't published any public SOPs yet."
            }
            action={
              isOwner && user.role === "seller"
                ? {
                    label: "Create SOP",
                    href: "/sops/new",
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sops.map((sop) => (
              <SOPCard key={sop.id} sop={sop} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
