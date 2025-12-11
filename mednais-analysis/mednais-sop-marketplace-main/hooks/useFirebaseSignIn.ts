import { useEffect } from "react";
import { type User as FirebaseUser } from "firebase/auth";
import { signIn as nextAuthSignIn, useSession } from "next-auth/react";
import { useAuth } from "@/lib/auth-context";

export function useFirebaseSignIn() {
  const { user: firebaseUser, loading, signOut: firebaseSignOut } = useAuth();
  const { data: session } = useSession() || {};

  useEffect(() => {
    if (session) return;
    if (!loading && firebaseUser) {
      // Sync Firebase user data to NextAuth session
      syncFirebaseToNextAuth(firebaseUser, firebaseSignOut);
    }
  }, [session, firebaseUser, loading, firebaseSignOut]);
}

async function syncFirebaseToNextAuth(
  firebaseUser: FirebaseUser,
  firebaseSignOut: () => Promise<void>
) {
  try {
    const token = await firebaseUser.getIdToken();
    const response = await nextAuthSignIn("credentials", {
      token,
      // redirect: false,
      callbackUrl: '/dashboard'
    });
    console.debug("syncFirebaseToNextAuth", "response:", response);
    if (!response || !response.ok) {
      throw new Error("Cannot sign in with Firebase token");
    }
  } catch (error) {
    console.error("Failed to sync Firebase user to NextAuth:", error);
    await firebaseSignOut();
  }
}