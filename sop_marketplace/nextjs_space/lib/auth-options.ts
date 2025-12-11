
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";

// Conditional providers array based on environment
const providers: any[] = [
  EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || "",
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
        auth: {
          user: process.env.EMAIL_SERVER_USER || "",
          pass: process.env.EMAIL_SERVER_PASSWORD || "",
        },
      },
      from: process.env.EMAIL_FROM || "noreply@sop-marketplace.com",
      // For MVP testing: log magic links to console
      sendVerificationRequest: async ({ identifier: email, url }) => {
        console.log("=".repeat(80));
        console.log("🔐 MAGIC LINK AUTHENTICATION");
        console.log("=".repeat(80));
        console.log(`Email: ${email}`);
        console.log(`Magic Link: ${url}`);
        console.log("=".repeat(80));
        console.log("Copy the magic link above and paste it in your browser to sign in.");
        console.log("=".repeat(80));
      },
    }),
];

// Add credentials provider ONLY for testing/development
// This allows automated testing but should NOT be used in production
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_AUTH === 'true') {
  providers.push(
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // For testing: check password is "1111"
        if (credentials.password !== "1111") {
          return null;
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        // Return user if found and password matches
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      // При первом входе (когда user существует), добавляем данные в токен
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
        // Fetch user role from database
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, bio: true },
        });
        if (user) {
          session.user.role = user.role;
          session.user.bio = user?.bio;
        }
      }
      return session;
    },
  },
  debug: false, // Disabled for production readiness
};
