
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { CartClient } from "./cart-client";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/signin?callbackUrl=/cart");
  }

  return <CartClient />;
}
